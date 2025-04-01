import { createOpenAI, type OpenAIProvider, type OpenAIProviderSettings } from '@ai-sdk/openai';
import { traverse } from '@stoplight/json';
import {
  createDataStreamResponse,
  customProvider,
  type DataStreamWriter,
  formatDataStreamPart,
  generateObject,
  jsonSchema,
  type LanguageModelUsage,
  streamText,
  type UIMessage,
} from 'ai';
import _cloneDeep from 'lodash/cloneDeep';
import _set from 'lodash/set';
import { nanoid } from 'nanoid';
import Nimma, { type Callback } from 'nimma';
import { z } from 'zod';

import type { ClientServerManager, Tool } from './client-servers.ts';
import type { Server } from './servers.ts';
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

type SupportedProvider = keyof NonNullable<MpcConductorSettings['providers']>;

interface MpcConductorOptions {
  serversByClientId: ClientServerManager['serversByClientId'];
  toolsByClientId: ClientServerManager['toolsByClientId'];
  callTool: ClientServerManager['callTool'];
  llmProxyUrl?: string | ((opts: { provider: SupportedProvider }) => string);
  settings?: MpcConductorSettings;
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

export type MpcConductorAnnotation =
  | {
      type: 'planning-usage' | 'assistant-usage';
      usage: LanguageModelUsage;
    }
  | {
      type: 'tool-usage';
      usage: LanguageModelUsage;
      toolCallId: string;
    };

const planSchema = z.object({
  reasoning: z
    .string()
    .describe(
      'A short description of the reasoning behind the plan. Do not solve the task here, just briefly describe why you chose the steps you did, or why you chose no steps.',
    ),
  steps: z.array(
    z.object({
      // Using the term "agent" here because it seems to help the LLM (vs "server")
      agentId: z
        .string()
        .describe('The id of the agent. This id MUST match one of the ids in the available_agents list.'),
      task: z.string().describe('A description of the task the agent will need to complete.'),
    }),
  ),
});

const createProvider = (opts: { settings: MpcConductorSettings; llmProxyUrl: MpcConductorOptions['llmProxyUrl'] }) => {
  const providerSettings = ({
    provider,
    settings,
  }: {
    provider: SupportedProvider;
    settings?: OpenAIProviderSettings;
  }) => {
    const llmProxyUrl = typeof opts.llmProxyUrl === 'function' ? opts.llmProxyUrl({ provider }) : opts.llmProxyUrl;

    // Prefer their baseURL if provided, otherwise use the proxy if no apiKey is provided
    const baseURL = settings?.baseURL ?? (settings?.apiKey ? undefined : llmProxyUrl);

    return {
      // ai-sdk does not send requests if apiKey is not provided, so if
      // using a proxy, set to empty string by default
      apiKey: baseURL ? '' : undefined,
      ...settings,
      baseURL,
      compatibility: 'strict',
    } as const;
  };

  const openai = createOpenAI(providerSettings({ provider: 'openai', settings: opts.settings.providers?.openai }));

  return customProvider({
    languageModels: {
      'text-simple': openai('gpt-4o-mini'),
      text: openai('gpt-4o'),
      structure: openai('gpt-4o'),
      planning: openai('gpt-4o'),
    },
  });
};

/**
 * Our default implementation of the MpcConductor interface.
 */
export class MpcConductor {
  #serversByClientId: MpcConductorOptions['serversByClientId'];
  #toolsByClientId: MpcConductorOptions['toolsByClientId'];
  #callTool: MpcConductorOptions['callTool'];
  #provider: ReturnType<typeof createProvider>;
  #settings: MpcConductorSettings;
  #llmProxyUrl?: MpcConductorOptions['llmProxyUrl'];

  constructor(options: MpcConductorOptions) {
    this.#serversByClientId = options.serversByClientId;
    this.#toolsByClientId = options.toolsByClientId;
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

  public handleMessage = async ({
    clientId,
    message,
    history = [],
    onError,
    onFinish,
    onStepFinish,
  }: MpcConductorHandleMessageOpts) => {
    return createDataStreamResponse({
      // @TODO might not want to always pass through to consumer.. e.g. if this is on the server
      onError(error) {
        console.error('Conductor.handleMessage.onError', error);

        if (error == null) {
          return 'unknown error';
        }

        if (typeof error === 'string') {
          return error;
        }

        if (error instanceof Error) {
          return error.message;
        }

        return JSON.stringify(error);
      },
      execute: async dataStream => {
        const servers = await this.#serversByClientId({ clientId });
        const tools = await this.#toolsByClientId({ clientId, lazyConnect: true });

        const plan = await this.createPlan({ message, history, servers, dataStream });

        const stepMessages: UIMessage[] = [];
        for (const step of plan.object.steps) {
          const server = servers.find(s => s.id === step.agentId);
          if (!server) {
            throw new Error(`Server "${step.agentId}" not found`);
          }

          const stepMessage = await this.runPlanStep({
            clientId,
            step,
            server,
            tools,
            history: stepMessages,
            dataStream,
          });

          stepMessages.push(stepMessage);
        }

        const result = streamText({
          model: this.#provider.languageModel('text'),
          messages: [...history, ...stepMessages, message],
          onError,
          onStepFinish,
          onFinish: event => {
            dataStream.writeMessageAnnotation({
              type: 'assistant-usage',
              usage: event.usage,
            } satisfies MpcConductorAnnotation);

            console.log('handleMessage.onFinish', event);

            return onFinish?.(event);
          },
        });

        result.mergeIntoDataStream(dataStream);
      },
    });
  };

  public async updateSettings(settings: MpcConductorSettings) {
    this.#settings = settings;
    this.#provider = this.#initProvider();
  }

  private async createPlan({
    message,
    history,
    servers,
    dataStream,
  }: {
    message: UIMessage;
    history: UIMessage[];
    servers: Server[];
    dataStream: DataStreamWriter;
  }) {
    // Convert to a formatted JSON string
    const agentsJson = JSON.stringify(
      servers.map(t => ({ id: t.id, name: t.name })),
      null,
      2,
    );

    const system = `
You are an AI assistant tasked with creating a plan to address the user's message by utilizing the available agents, if necessary.

- Think through the user's request, and create a plan that lists the steps required to fulfill the request, along with the agent that must complete the step.
- If the user's request is simple and can be fulfilled without the help of any of these agents (for example, from data in the message history), you should return an empty steps array.
- If you believe any part of the user's request requires an agent that is not listed below, add a step with agentId "unknown" and a task that describes the part of the request that requires an agent.
- Each step will have access to the information from prior steps, try not to add steps that essentially duplicate themselves

Below is the list of available agents:

<available_agents>
${agentsJson}
</available_agents>
`;

    const plan = await generateObject({
      model: this.#provider.languageModel('planning'),
      system,
      messages: [...history, message],
      schema: planSchema,
    });

    dataStream.writeMessageAnnotation({
      type: 'planning-usage',
      usage: plan.usage,
    } satisfies MpcConductorAnnotation);

    console.log('createPlan', { plan });

    return plan;
  }

  private async runPlanStep({
    clientId,
    step,
    server,
    tools: allTools,
    history,
    dataStream,
  }: {
    clientId: ClientId;
    step: z.infer<typeof planSchema>['steps'][number];
    server: Server;
    tools: Tool[];
    history: UIMessage[];
    dataStream: DataStreamWriter;
  }) {
    const tools = allTools.filter(t => t.server === server.id);

    const plan = await this.#createStepPlan({ step, server, tools, dataStream });

    const stepMessage: UIMessage = {
      id: nanoid(),
      role: 'assistant',
      content: '',
      parts: [],
    };

    for (const step of plan.object.steps) {
      const toolCallId = nanoid();

      const tool = tools.find(t => t.name === step.tool);
      if (!tool) {
        throw new Error(`Tool "${step.tool}" not found for server "${server.id}"`);
      }

      const toolId = `${server.id}__${step.tool}`;

      console.log(`${toolId} - runPlanStep`, { tool });

      // const { object: toolCallObj, usage: toolCallUsage } = await generateObject({
      //   model: this.#supervisor.model,
      //   system: `
      //   A request is being made to a tool named "${tool.name}". ${tool.description ? `This tool is described as "${tool.description}".` : ''}

      //   We need to:

      //   1. Use the message history to generate an input object that matches the tool's input schema.
      //   2. Use the tool's description, the user's message history, and the tool's response schema, to generate a json path expression that can be used to extract the minimum data needed to answer the user's request.

      //   Here is the tool's input schema:

      //   <tool_input_schema>
      //   ${JSON.stringify(tool.inputSchema, null, 2)}
      //   </tool_input_schema>

      //   For the json path expression(s):

      //   - Please generate a json path expression that can be used to extract the minimum data needed to answer the user's request.
      //   - The goal is to reduce the size of the response, while still being able to fulfill the user's request.
      //   - If you believe that the data retrieved from the primary json path may not be sufficient to answer the user's request, you can provide secondary json paths.
      //   - The JSON path that you provide MUST BE A VALID JSON PATH FOR THE GIVEN SCHEMA.
      //   - IMPORTANT: Air on the side of simpler JSON path expressions if possible. It is better to use a simpler json path expression that results in a larger data set than to use a complex json path expression that might not work.

      //   <tool_response_schema>
      //   ${JSON.stringify(tool.outputSchema, null, 2)}
      //   </tool_response_schema>
      //   `,

      //   messages: [...history, { role: 'user', content: step.task }],

      //   schema: z.object({
      //     toolInput: z.any(),
      //     primaryJsonPath: z.string().describe('A json path that is valid for the tool response schema.'),
      //     secondaryJsonPaths: z
      //       .array(z.string().optional())
      //       .describe(
      //         "Secondary json paths that are valid for the tool response schema. Use this only if you believe that the data retrieved from the primary json path may not be sufficient to answer the user's request.",
      //       ),
      //   }),
      // });

      const { object: toolCallObj, usage: toolCallUsage } = await generateObject({
        model: this.#provider.languageModel('structure'),
        system: `
        A request is being made to a tool named "${tool.name}". ${tool.description ? `This tool is described as "${tool.description}".` : ''}

        Use the message history, the tool's description, and the tool's input schema to generate an input object that matches the tool's input schema.

        This input object will be passed to the tool to accomplish the requested task.

        IMPORTANT:

        1. Ignore properties the are used for authentication, we will handle that separately.
        2. With the exception of auth properties mentioned in point 1, the input object MUST be valid according to the tool's input schema

        Here is the tool's input schema:

        <tool_input_schema>
        ${JSON.stringify(tool.inputSchema, null, 2)}
        </tool_input_schema>
        `,

        messages: [...history, stepMessage, { role: 'user', content: step.task }],

        schema: jsonSchema({
          type: 'object',
          properties: {
            toolInput: tool.inputSchema,
          },
          required: ['toolInput'],
        }),
      });

      dataStream.writeMessageAnnotation({
        toolCallId,
        type: 'tool-usage',
        usage: toolCallUsage,
      } satisfies MpcConductorAnnotation);

      console.log(`${toolId} - runPlanStep`, { toolCallObj });

      const toolInput = (toolCallObj as any).toolInput ?? {};

      dataStream.write(
        formatDataStreamPart('tool_call', {
          toolCallId,
          toolName: toolId,
          args: toolInput,
        }),
      );

      const toolResult = await this.#callTool({
        clientId,
        serverId: tool.server,
        name: step.tool,
        input: toolInput,
      });

      // @TODO handle bad json response
      let toolResultContent = JSON.parse(toolResult?.content?.[0]?.text ?? '{}');

      const trimmedResult = _cloneDeep(toolResultContent);
      traverse(trimmedResult, {
        onProperty: ({ parent, property, propertyValue }) => {
          if (Array.isArray(propertyValue)) {
            _set(parent, property, propertyValue.slice(0, 1));
          }
        },
      });

      const { object: toolOutputPaths } = await generateObject({
        model: this.#provider.languageModel('structure'),
        system: `
        A request was just made to a tool named "${tool.name}". ${tool.description ? `This tool is described as "${tool.description}".` : ''}

        We need to use the tool's description, the user's message history, and the provided truncated tool output.

        The json path expression(s) that you generate will be used on the full tool output to extract the minimum data needed to answer the user's request.

        - The goal is to reduce the size of the response, while still being able to fulfill the user's request.
        - If you believe that the data retrieved from the primary json path may not be sufficient to answer the user's request, you can provide secondary json paths.
        - The JSON path that you provide MUST BE A VALID JSON PATH FOR THE GIVEN ABREVIATED TOOL OUTPUT.
        - IMPORTANT: Air on the side of simpler JSON path expressions if possible. It is better to use a simpler json path expression that results in a larger data set than to use a complex json path expression that might not work.
        - IMPORTANT: avoid using json path filter expressions like $.data.results[?(@.name == "John")].id, instead use $.data.results[*].id which is safer even if it retrieves more data. Use secondaryJsonPaths if you need multiple properties.

        <abbreviated_tool_output>
        ${JSON.stringify(trimmedResult, null, 2)}
        </abbreviated_tool_output>
        `,

        messages: [...history, { role: 'user', content: step.task }],

        schema: z.object({
          primaryJsonPath: z
            .string()
            .describe(
              'A json path that is valid for the tool output. For example: $.data.results[0].id, $.data.results[*].name, etc.',
            ),
          secondaryJsonPaths: z
            .array(z.string().optional())
            .describe(
              "Optional secondary json paths that are valid for the tool output. Use this only if you believe that the data retrieved from the primary json path may not be sufficient to answer the user's request.",
            )
            .default([]),
        }),
      });

      // @TODO remove once can do this on the server? or better to leave here?
      const summarizedResult = {};
      const nimmaCallBacks: Record<string, Callback> = {};
      if (toolOutputPaths.primaryJsonPath) {
        nimmaCallBacks[toolOutputPaths.primaryJsonPath] = ({ path, value }) => {
          _set(summarizedResult, path, value);
        };
      }

      if (toolOutputPaths.secondaryJsonPaths) {
        for (const secondaryJsonPath of toolOutputPaths.secondaryJsonPaths) {
          if (!secondaryJsonPath) continue;

          nimmaCallBacks[secondaryJsonPath] = ({ path, value }) => {
            _set(summarizedResult, path, value);
          };
        }
      }

      try {
        Nimma.query(toolResultContent, nimmaCallBacks);
      } catch (error) {
        console.error(`${toolId} - runPlanStep.nimmaError`, { error, toolOutputPaths, toolResultContent });
      }

      console.log(`${toolId} - runPlanStep`, {
        toolOutputPaths,
        toolResult,
        trimmedResult,
        toolResultContent,
        summarizedResult,
      });

      toolResultContent = Object.keys(summarizedResult).length ? summarizedResult : toolResultContent;

      dataStream.write(
        formatDataStreamPart('tool_result', {
          toolCallId,
          result: toolResultContent,
        }),
      );

      stepMessage.parts.push({
        type: 'tool-invocation',
        toolInvocation: {
          toolCallId,
          state: 'result',
          toolName: toolId,
          args: toolCallObj.toolInput ?? {},
          result: toolResultContent,
        },
      });
    }

    return stepMessage;
  }

  async #createStepPlan({
    step,
    server,
    tools,
    dataStream,
  }: {
    step: z.infer<typeof planSchema>['steps'][number];
    server: Server;
    tools: Tool[];
    dataStream: DataStreamWriter;
  }) {
    const partialPlanSchema = z.object({
      reasoning: z
        .string()
        .describe(
          'A short description of the reasoning behind the plan. Do not solve the task here, just briefly describe why you chose the steps you did, or why you chose no steps.',
        ),
      steps: z.array(
        z.object({
          task: z
            .string()
            .describe(
              'A short and helpful description of what the agent needs to accomplish in this step. Remember that the agent has access to the message history, so you do not need to repeat any of that here.',
            ),
          tool: z
            .string()
            .describe('The name of the tool to use. This name MUST BE ONE of the names in the available_tools list.'),
        }),
      ),
    });

    // Convert the tools array to a formatted JSON string
    const toolsJson = JSON.stringify(
      tools.map(t => ({ name: t.name, description: t.description })),
      null,
      2,
    );

    const system = `
You are an AI assistant specialized to work with ${server.name}. You are tasked with creating a plan to address the requested task by utilizing the available tools, if necessary.

- Create a plan that specifies a sequence of tools to use.
- If the user's request can be fulfilled without using any tools (for example, from data in the message history), you should return an empty array.
- You may need to use multiple tools to fulfill the task.
- You may need to use the same tool multiple times in the plan.
- IMPORTANT: each step has access to the information from prior steps, try not to add steps that essentially duplicate themselves
- IMPORTANT: consider each tool carefully to generate a plan that requires the lease number of steps possible

Below is the list of available tools with their descriptions:

<available_tools>
${toolsJson}
</available_tools>
`;

    const plan = await generateObject({
      model: this.#provider.languageModel('planning'),
      system,
      prompt: `Create a plan to fulfill the following task: "${step.task}"`,
      schema: partialPlanSchema,
    });

    console.log(`${server.id} - #createStepPlan`, { step, plan });

    dataStream.writeMessageAnnotation({
      type: 'planning-usage',
      usage: plan.usage,
    } satisfies MpcConductorAnnotation);

    return plan;
  }

  #initProvider() {
    return createProvider({ settings: this.#settings, llmProxyUrl: this.#llmProxyUrl });
  }
}
