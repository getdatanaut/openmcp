import type { UIMessage } from 'ai';
import { createDataStreamResponse, formatDataStreamPart, generateObject } from 'ai';
import { z } from 'zod';

import type { ClientServerManager } from '../client-servers.ts';
import type { ClientId } from '../types.ts';
import { processMessage } from './process-message.ts';
import { createProvider, type MpcConductorProvider, type MpcConductorProviderSettings } from './provider.ts';

export interface MpcConductorSettings {
  providers?: MpcConductorProviderSettings['providers'];
}

export interface MpcConductorOptions {
  serversByClientId: ClientServerManager['serversByClientId'];
  toolsByClientId: ClientServerManager['toolsByClientId'];
  listClientServers: ClientServerManager['findMany'];
  callTool: ClientServerManager['callTool'];
  llmProxyUrl?: MpcConductorProviderSettings['llmProxyUrl'];
  settings?: MpcConductorSettings;
}

export interface MpcConductorHandleMessageOpts {
  clientId: ClientId;

  message: UIMessage;

  /** The consumer may or may not provide some portion of the message history for consideration */
  history?: UIMessage[];
}

export function createMpcConductor(options: MpcConductorOptions) {
  return new MpcConductor(options);
}

export class MpcConductor {
  #serversByClientId: MpcConductorOptions['serversByClientId'];
  #toolsByClientId: MpcConductorOptions['toolsByClientId'];
  #listClientServers: MpcConductorOptions['listClientServers'];
  #callTool: MpcConductorOptions['callTool'];
  #provider: MpcConductorProvider;
  #llmProxyUrl: MpcConductorOptions['llmProxyUrl'];
  #settings: MpcConductorOptions['settings'];

  constructor(options: MpcConductorOptions) {
    this.#serversByClientId = options.serversByClientId;
    this.#toolsByClientId = options.toolsByClientId;
    this.#listClientServers = options.listClientServers;
    this.#callTool = options.callTool;
    this.#llmProxyUrl = options.llmProxyUrl;
    this.#settings = options.settings ?? {};
    this.#provider = this.#initProvider();
  }

  public generateTitle = async ({ messages }: { messages: UIMessage[] }) => {
    const { object: llmObject } = await generateObject({
      model: this.#provider.languageModel('text-simple'),
      system: `Create a concise thread title that summarizes these messages, suitable for display in a UI sidebar.`,
      messages,
      schema: z.object({
        title: z.string(),
      }),
    });

    return llmObject.title;
  };

  public handleMessage = async ({ clientId, message, history = [] }: MpcConductorHandleMessageOpts) => {
    return createDataStreamResponse({
      onError(error) {
        console.error('Conductor.handleMessage.onError', error);

        if (error == null) {
          return 'unknown error';
        }

        if (error instanceof Error) {
          return error.message;
        }

        if (typeof error === 'string') {
          return error;
        }

        return JSON.stringify(error);
      },
      execute: async dataStream => {
        const clientServers = await this.#listClientServers({ clientId, enabled: true });
        const servers = await this.#serversByClientId({ clientId });
        const tools = await this.#toolsByClientId({ clientId, lazyConnect: true });

        const result = await processMessage({
          clientId,
          message,
          history,
          clientServers,
          servers,
          tools,
          provider: this.#provider,
          callTool: this.#callTool,
          dataStream,
        });

        result.match(
          () => {
            // Success case - nothing to do as the dataStream has already been written to
          },
          error => {
            if (error.type === 'LlmOutputParse') {
              // If the error is due to the LLM output not being parseable, it's probably an LLM response we can just stream to the user as-is
              // Sometimes the LLM ignores our directions to output in a specific format
              dataStream.write(formatDataStreamPart('text', error.text));
              return;
            }

            console.error('Conductor.handleMessage.processError', error);

            throw new Error(String(error));
          },
        );
      },
    });
  };

  public async updateSettings(settings: MpcConductorSettings) {
    this.#settings = settings;
    this.#provider = this.#initProvider();
  }

  #initProvider() {
    return createProvider({ llmProxyUrl: this.#llmProxyUrl, providers: this.#settings?.providers });
  }
}
