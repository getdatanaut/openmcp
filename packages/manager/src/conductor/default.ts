import { createOpenAI, type OpenAIProvider, type OpenAIProviderSettings } from '@ai-sdk/openai';
import { jsonSchema, type LanguageModelV1, streamText, tool as createTool } from 'ai';

import type { MpcManager } from '../manager.ts';
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
  return (manager: MpcManager) => new DefaultMpcConductor(config, manager);
}

/**
 * Our default implementation of the MpcConductor interface.
 */
export class DefaultMpcConductor implements MpcConductor {
  #supervisor: MpcSupervisor;
  #settings: DefaultMpcConductorSettings;
  #llmProxyUrl?: DefaultMpcConductorOptions['llmProxyUrl'];
  #manager: MpcManager;

  constructor(options: DefaultMpcConductorOptions, manager: MpcManager) {
    this.#manager = manager;
    this.#llmProxyUrl = options.llmProxyUrl;
    this.#settings = options.settings ?? {};
    this.#supervisor = this.initSupervisor();
  }

  // @QUESTION: what happens if end user sends message, then immediately sends another one without waiting for the first one to finish?
  public handleMessage: MpcConductor['handleMessage'] = async ({ clientId, threadId, message, history = [] }) => {
    // @TODO this implementation should probaby cache the tools, and use the mpc notification spec or something to update them (although now w stateless protocol maybe not)
    // right now we're fetching all of the tools on every message
    const tools = await this.#manager.clientServers.toolsByClientId({ clientId, lazyConnect: true });

    const aiTools = tools.reduce(
      (acc, tool) => {
        // @ts-expect-error crazy zod stuff going on here... bah
        acc[tool.name] = createTool({
          id: `${tool.server}.${tool.name}` as const,
          description: tool.description,
          parameters: jsonSchema(tool.inputSchema as any),
          execute: tool.execute,
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
      onFinish: async opts => {
        /** If a threadId was provided, store the response messages in the thread */
        if (threadId) {
          const { response } = opts;
          const thread = await this.#manager.threads.get({ id: threadId });
          if (thread) {
            await thread.addResponseMessages({
              originalMessages: messages,
              responseMessages: response.messages,
            });
          } else {
            console.warn('Thread not found in conductorRun onFinish', { clientId, threadId });
          }
        }
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
        languageModelId: 'gpt-4o',
      } satisfies DefaultMpcConductorSettings['supervisor']);

    const settings = this.#settings.providers?.[supervisor.provider]?.settings;

    const llmProxyUrl =
      typeof this.#llmProxyUrl === 'function'
        ? this.#llmProxyUrl({ provider: supervisor.provider })
        : this.#llmProxyUrl;

    const finalSettings = {
      // ai-sdk does not send requests if apiKey is not provided
      apiKey: '',
      ...settings,
      // Prefer their baseURL if provided, otherwise use the proxy if no apiKey is provided
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
