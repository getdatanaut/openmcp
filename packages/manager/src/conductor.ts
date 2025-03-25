import { createOpenAI, type OpenAIProvider, type OpenAIProviderSettings } from '@ai-sdk/openai';
import { generateObject, jsonSchema, type LanguageModelV1, streamText, tool as createTool, type UIMessage } from 'ai';
import { z } from 'zod';

import type { ClientServerManager } from './client-servers.ts';
import type { ClientId } from './types.ts';

export interface MpcConductorSettings {
  supervisor?: {
    provider: 'openai';
    languageModelId: Parameters<OpenAIProvider['chat']>[0];
  };
  providers?: {
    openai?: OpenAIProviderSettings;
  };
}

interface MpcConductorOptions {
  toolsByClientId: ClientServerManager['toolsByClientId'];
  llmProxyUrl?: string | ((opts: { provider: keyof NonNullable<MpcConductorSettings['providers']> }) => string);
  settings?: MpcConductorSettings;
}

interface MpcSupervisor {
  model: LanguageModelV1;
}

interface MpcConductorHandleMessageOpts
  extends Pick<Parameters<typeof streamText>[0], 'onError' | 'onStepFinish' | 'onFinish'> {
  clientId: ClientId;

  message: UIMessage;

  /** The consumer may or may not provide some portion of the message history for consideration */
  history?: UIMessage[];
}

export function createMpcConductor(options: MpcConductorOptions) {
  return new MpcConductor(options);
}

// Folks using manager are coming from a world where they probably have a chat app, but are prob not using tons of
// tools. conductor optimizes the prompting and system loop of interacting and utilizing that system of tools.

/**
 * Our default implementation of the MpcConductor interface.
 */
export class MpcConductor {
  #toolsByClientId: MpcConductorOptions['toolsByClientId'];
  #supervisor: MpcSupervisor;
  #settings: MpcConductorSettings;
  #llmProxyUrl?: MpcConductorOptions['llmProxyUrl'];

  constructor(options: MpcConductorOptions) {
    this.#toolsByClientId = options.toolsByClientId;
    this.#llmProxyUrl = options.llmProxyUrl;
    this.#settings = options.settings ?? {};
    this.#supervisor = this.initSupervisor();
  }

  public generateTitle = async ({ messages }: { messages: UIMessage[] }) => {
    const { object: llmObject } = await generateObject({
      // @TODO might want to use a different, lightweight model for this
      model: this.#supervisor.model,
      system: `Create a concise thread title that summarizes these messages, suitable for display in a UI sidebar.`,
      messages,
      schema: z.object({
        title: z.string(),
      }),
    });

    return llmObject.title;
  };

  public handleMessage = async ({
    clientId,
    message,
    history = [],
    onError,
    onFinish,
    onStepFinish,
  }: MpcConductorHandleMessageOpts) => {
    const messages = [...history, message];

    // @TODO the underlying implementation should probaby cache the tools, and use the mpc notification spec or something to update them (although now w stateless protocol maybe not)
    // right now we're fetching all of the tools on every message
    const tools = await this.#toolsByClientId({ clientId, lazyConnect: true });
    const allToolNames = tools.map(t => t.name);

    const toolsByServer = tools.reduce(
      (acc, tool) => {
        acc[tool.server] = acc[tool.server] || [];
        acc[tool.server]!.push(tool);
        return acc;
      },
      {} as Record<string, typeof tools>,
    );

    const { object: llmObject } = await generateObject({
      model: this.#supervisor.model,
      system: `Select the tools you might need based on the user's request.

The tools available are:

${Object.entries(toolsByServer)
  .map(([server, tools]) => {
    return `## ${server}
${tools.map(t => `- ${t.name}: ${t.description}`).join('\n')}`;
  })
  .join('\n')}`,
      messages,
      schema: z.object({
        selectedTools: z
          .array(z.enum(allToolNames as [string, ...string[]]))
          .describe("The tools you might need based on the user's request."),
        summaryOfAllTools: z.string().describe('A general summary of all tools available.'),
        confidence: z
          .number()
          .min(0)
          .max(1)
          .describe('A number between 0 and 1 indicating the confidence in the tools selected.'),
      }),
    });

    console.log('LLM selected tools:', llmObject);

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

    const selectedToolNames = llmObject.selectedTools.length > 0 ? llmObject.selectedTools : allToolNames;

    const result = streamText({
      model: this.#supervisor.model,
      system: `You are a helpful assistant with access to tools the user has enabled.`,
      messages,
      maxSteps: 5,
      tools: aiTools,
      // Abitrarily limit to 50 tools
      experimental_activeTools: selectedToolNames.slice(0, 50),
      onError,
      onFinish,
      onStepFinish,
    });

    return result.toDataStreamResponse();
  };

  public async updateSettings(settings: MpcConductorSettings) {
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
      } satisfies MpcConductorSettings['supervisor']);

    const settings = this.#settings.providers?.[supervisor.provider];

    const llmProxyUrl =
      typeof this.#llmProxyUrl === 'function'
        ? this.#llmProxyUrl({ provider: supervisor.provider })
        : this.#llmProxyUrl;

    // Prefer their baseURL if provided, otherwise use the proxy if no apiKey is provided
    const baseURL = settings?.baseURL ?? (settings?.apiKey ? undefined : llmProxyUrl);

    const finalSettings = {
      // ai-sdk does not send requests if apiKey is not provided, so if
      // using a proxy, set to empty string by default
      apiKey: baseURL ? '' : undefined,
      ...settings,
      baseURL,
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
