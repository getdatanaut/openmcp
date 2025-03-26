import { createOpenAI, type OpenAIProvider, type OpenAIProviderSettings } from '@ai-sdk/openai';
import {
  convertToCoreMessages,
  createDataStreamResponse,
  generateObject,
  jsonSchema,
  type LanguageModelV1,
  NoSuchToolError,
  streamText,
  tool as createTool,
  type UIMessage,
} from 'ai';
import { z } from 'zod';

import type { ClientServerManager, Tool } from './client-servers.ts';
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
  callTool: ClientServerManager['callTool'];
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
  #callTool: MpcConductorOptions['callTool'];
  #supervisor: MpcSupervisor;
  #settings: MpcConductorSettings;
  #llmProxyUrl?: MpcConductorOptions['llmProxyUrl'];

  constructor(options: MpcConductorOptions) {
    this.#toolsByClientId = options.toolsByClientId;
    this.#callTool = options.callTool;
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
    return createDataStreamResponse({
      execute: async dataStream => {
        const tools = await this.#toolsByClientId({ clientId, lazyConnect: true });

        const result = this.#streamText({
          clientId,
          tools,
          message,
          history,
          onError,
          onStepFinish,
          onFinish: event => {
            dataStream.writeMessageAnnotation({
              usage: event.usage,
            });

            return onFinish?.(event);
          },
        });

        result.mergeIntoDataStream(dataStream);
      },
    });
  };

  #streamText = ({
    clientId,
    message,
    tools,
    history = [],
    onError,
    onFinish,
    onStepFinish,
  }: MpcConductorHandleMessageOpts & { tools: Tool[] }) => {
    const coreMessages = convertToCoreMessages([...history, message]);
    console.log('handleMessage.coreMessages', coreMessages);
    // Minimal information needed to reconstruct the conversation
    const messages = coreMessages.flatMap(message => {
      // Ignore tool results
      if (message.role === 'tool') {
        return [];
      }

      // Ignore tool calls and empty assistant messages
      if (message.role === 'assistant') {
        const content =
          typeof message.content === 'string'
            ? message.content
            : message.content.filter(c => {
                if (c.type === 'text') {
                  // Ignore empty messages
                  return c.text.length > 0;
                }

                // Ignore tool calls
                return c.type !== 'tool-call';
              });

        if (!content.length) {
          return [];
        }

        return {
          ...message,
          content,
        };
      }

      return message;
    });
    console.log('handleMessage.minimalMessages', messages);

    // Do not include tool `inputSchema` or `outputSchema` in the system prompt
    const minimalToolInfo = tools.map(t => ({
      server: t.server,
      name: t.name,
      description: t.description,
    }));
    const servers = Array.from(new Set(minimalToolInfo.map(t => t.server)));

    return streamText({
      model: this.#supervisor.model,
      system: `You are a helpful assistant with access to tools the user has enabled.

<example>
A typical interaction should look like this:

1. User makes a request to you.
2. You use choose the best tools to use based on the user's request.
3. Call "getTool" to get the input for "callTool".
4. Call "callTool" to retreive the results of the tool.
5. You repeat steps 3 and 4 until the user's request is fulfilled.
6. You send a message to the user with the results.
</example>

You should only use "callTool" once you have called "getTool" and received a response.

The tools available are:

<tools>
${JSON.stringify(minimalToolInfo, null, 2)}
</tools>
`,
      toolCallStreaming: true,
      messages,
      maxSteps: 10,
      toolChoice: 'auto',
      tools: {
        listTools: createTool({
          description: 'List all available tools',
          parameters: z.object({
            server: z
              .enum(servers as [string, ...string[]])
              .optional()
              .describe('Optionally filter by a specific server'),
          }),
          execute: async ({ server }) => {
            console.log('listTools.args', { server });
            if (server) {
              return minimalToolInfo.filter(t => t.server === server);
            }

            return minimalToolInfo;
          },
        }),

        getTool: createTool({
          description: "Get details about a tool including the tool's inputSchema",
          parameters: z.object({
            server: z.enum(servers as [string, ...string[]]).describe('The server of the tool'),
            name: z.string().describe('The name of the tool'),
          }),
          execute: async ({ server, name }) => {
            console.log('getTool.args', { server, name });
            const tool = tools.find(t => t.server === server && t.name === name);
            if (!tool) {
              return new Error('Tool not found');
            }

            const result = {
              server: tool.server,
              name: tool.name,
              description: tool.description,
              inputSchema: tool.inputSchema,
              outputSchema: tool.outputSchema,
            };
            console.log('getTool.result', result);

            return result;
          },
        }),

        callTool: createTool({
          description: 'Call a tool. IMPORTANT: Use "getTool" before calling this tool.',
          parameters: z.object({
            server: z.enum(servers as [string, ...string[]]).describe('The server of the tool'),
            name: z.string().describe('The name of the tool'),
            inputSchema: z
              .object({})
              .passthrough()
              .describe(
                'The inputSchema of the tool as returned by getTool. This is the shape of the input that should be provided to the tool.',
              ),
            input: z
              .object({})
              .passthrough()
              .describe(
                "Input that should be provided to the tool as a JSON object in the shape of the tool's inputSchema returned by getTool",
              ),
          }),
          execute: async args => {
            console.log('callTool.args', args);
            let input = args.input;
            if (!args.inputSchema) {
              const tool = tools.find(t => t.server === args.server && t.name === args.name);
              console.log('callTool.repair', tool);
              if (!tool) {
                return new Error('Tool not found');
              }

              const { object: repairedInput } = await generateObject({
                model: this.#supervisor.model,
                messages,
                schema: jsonSchema(tool.inputSchema),
                prompt: [
                  `The model tried to call the tool "${args.name}"` + ` with the following arguments:`,
                  JSON.stringify(args.input),
                  `The tool accepts the following schema:`,
                  JSON.stringify(tool.inputSchema, null, 2),
                  'Please fix the arguments.',
                ].join('\n'),
              });

              input = repairedInput as typeof args.input;
            }

            const result = await this.#callTool({
              clientId,
              serverId: args.server,
              name: args.name,
              input,
            });
            console.log('callTool.result', result);
            return result;
          },
        }),
      },
      experimental_repairToolCall: async ({ toolCall, error }) => {
        console.log('repairToolCall.args', toolCall);
        if (NoSuchToolError.isInstance(error)) {
          // do not attempt to fix invalid tool names
          return null;
        }

        if (toolCall.toolName !== 'callTool') {
          // only attempt to fix callTool
          return null;
        }

        const { server, name, input } = JSON.parse(toolCall.args);

        const tool = tools.find(t => t.server === server && t.name === name);
        if (!tool) {
          throw new Error(`Tool "${name}" not found on server "${server}"`);
        }

        const { object: repairedInput } = await generateObject({
          model: this.#supervisor.model,
          schema: jsonSchema(tool.inputSchema),
          messages,
          system: [
            `The model tried to call the tool "${name}"` + ` with the following arguments:`,
            JSON.stringify(input),
            `The tool accepts the following schema:`,
            JSON.stringify(tool.inputSchema, null, 2),
            'Please fix the arguments.',
          ].join('\n'),
        });

        console.log('repairToolCall.result', repairedInput);

        return {
          ...toolCall,
          args: JSON.stringify({
            server,
            name,
            input: repairedInput,
            inputSchema: tool.inputSchema,
          }),
        };
      },
      onError,
      onFinish,
      onStepFinish,
    });
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

    const finalSettings: OpenAIProviderSettings = {
      // ai-sdk does not send requests if apiKey is not provided, so if
      // using a proxy, set to empty string by default
      apiKey: baseURL ? '' : undefined,
      ...settings,
      baseURL,
      compatibility: 'strict',
    };

    switch (supervisor.provider) {
      case 'openai':
        return {
          model: createOpenAI(finalSettings)(supervisor.languageModelId, { structuredOutputs: false }),
        };
      default:
        throw new Error(`Unsupported supervisor provider: ${supervisor.provider}`);
    }
  }
}
