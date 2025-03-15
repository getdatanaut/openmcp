import { createOpenAI, type OpenAIProvider, type OpenAIProviderSettings } from '@ai-sdk/openai';
import { jsonSchema, type LanguageModelV1, streamText, tool as createTool } from 'ai';

import type { Manager } from '../manager.ts';
import type { MpcConductor, MpcConductorFactory } from './adapter.ts';

export interface DefaultMpcConductorSettings {
  supervisor?: {
    provider: 'openai';
    languageModelId: Parameters<OpenAIProvider['chat']>[0];
  };
  providers?: {
    openai?: {
      settings?: OpenAIProviderSettings;
    };
  };
}

interface DefaultMpcConductorOptions {
  llmProxyUrl?: string | ((opts: { provider: keyof NonNullable<DefaultMpcConductorSettings['providers']> }) => string);
  settings?: DefaultMpcConductorSettings;
}

interface MpcSupervisor {
  model: LanguageModelV1;
}

export function defaultMpcConductorFactory(config: DefaultMpcConductorOptions): MpcConductorFactory {
  return (manager: Manager) => new DefaultMpcConductor(config, manager);
}

/**
 * Our default implementation of the MpcConductor interface.
 */
export class DefaultMpcConductor implements MpcConductor {
  #supervisor: MpcSupervisor;
  #settings: DefaultMpcConductorSettings;
  #llmProxyUrl?: DefaultMpcConductorOptions['llmProxyUrl'];
  #manager: Manager;

  constructor(options: DefaultMpcConductorOptions, manager: Manager) {
    this.#manager = manager;
    this.#llmProxyUrl = options.llmProxyUrl;
    this.#settings = options.settings ?? {};
    this.#supervisor = this.initSupervisor();
  }

  // @QUESTION: what happens if end user sends message, then immediately sends another one without waiting for the first one to finish?
  public handleMessage: MpcConductor['handleMessage'] = async ({ threadId, message, history = [] }) => {
    // @QUESTION: when is this useful?
    /**
     * Most of the time the tools will be defined on the remote mpc servers right?
     * Vs in the config passed when registering a server on the local manager.
     * This is confusing since this only lists the tools that happened to be defined when registering the local sever,
     * which is incomplete. Unless I'm not understanding what this does... possible lol.
     */
    // const tools = await manager.listTools();

    const client = this.#manager.getClient('anonClientId')!;

    // @TODO client implementation should probaby cache the tools, and use the mpc notification spec to update them
    // right now we're fetching all of the tools on every message
    const tools = (await client.listTools()) || [];

    const aiTools = tools.reduce(
      (acc, tool) => {
        // @ts-expect-error crazy zod stuff going on here... bah
        acc[tool.name] = createTool({
          id: `${tool.server}.${tool.name}` as const,
          description: tool.description,
          parameters: jsonSchema(tool.inputSchema as any),
          execute: async args => {
            console.log('tool call', { tool, args });

            const result = await client.callTool({ serverId: tool.server, name: tool.name, input: args as any });

            console.log('tool result', result);

            return result;
          },
        });

        return acc;
      },
      {} as Record<string, ReturnType<typeof createTool>>,
    );

    const messages = [...history, message];

    const result = streamText({
      model: this.#supervisor.model,
      system: 'You are a helpful assistant.',
      messages,
      maxSteps: 5,
      tools: aiTools,
      onFinish: async ({ response }) => {
        const thread = await this.#manager.threads.get({ id: threadId });
        if (!thread) {
          console.warn('Thread not found in conductorRun onFinish', threadId);
          return;
        }

        void thread.addResponseMessages({
          originalMessages: messages,
          responseMessages: response.messages,
        });
      },
    });

    return result.toDataStreamResponse();
  };

  public async updateSettings(settings: DefaultMpcConductorSettings) {
    this.#settings = settings;
    this.#supervisor = this.initSupervisor();
  }

  private initSupervisor(): MpcSupervisor {
    const supervisor =
      this.#settings.supervisor ??
      // Our default settings
      ({
        provider: 'openai',
        languageModelId: 'gpt-4-turbo',
      } satisfies DefaultMpcConductorSettings['supervisor']);

    const settings = this.#settings.providers?.[supervisor.provider]?.settings;

    const llmProxyUrl =
      typeof this.#llmProxyUrl === 'function'
        ? this.#llmProxyUrl({ provider: supervisor.provider })
        : this.#llmProxyUrl;

    const finalSettings = {
      apiKey: '', // ai-sdk does not send requests if apiKey is not provided
      ...settings,
      /**
       * Prefer their baseURL if provided, otherwise use the proxy if no apiKey is provided
       */
      baseURL: settings?.baseURL ?? (settings?.apiKey ? undefined : llmProxyUrl),
    };

    switch (supervisor.provider) {
      case 'openai':
        return {
          model: createOpenAI(finalSettings)(supervisor.languageModelId),
        };
      default:
        throw new Error(`Unsupported supervisor provider: ${supervisor.provider}`);
    }
  }
}
