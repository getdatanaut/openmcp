import { type AnthropicProviderOptions, type AnthropicProviderSettings, createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI, type OpenAIProviderSettings } from '@ai-sdk/openai';
import type { LanguageModelV1FinishReason } from '@ai-sdk/provider';
import { traverse } from '@stoplight/json';
import {
  type CoreSystemMessage,
  type CoreUserMessage,
  createDataStreamResponse,
  customProvider,
  type DataStreamWriter,
  defaultSettingsMiddleware,
  formatDataStreamPart,
  generateObject,
  jsonSchema,
  type LanguageModelUsage,
  Output,
  streamText,
  type UIMessage,
  wrapLanguageModel,
  zodSchema,
} from 'ai';
import dedent from 'dedent';
import _cloneDeep from 'lodash/cloneDeep';
import _set from 'lodash/set';
import { nanoid } from 'nanoid';
import Nimma, { type Callback } from 'nimma';
import { z } from 'zod';

import type { ClientServer, ClientServerManager, Tool } from './client-servers.ts';
import type { Server } from './servers.ts';
import type { ClientId, ServerId } from './types.ts';

export interface MpcConductorSettings {
  // supervisor?: {
  //   provider: 'openai';
  //   languageModelId: Parameters<OpenAIProvider['chat']>[0];
  // };
  providers?: {
    openai?: OpenAIProviderSettings;
    anthropic?: AnthropicProviderSettings;
  };
}

type SupportedProvider = keyof NonNullable<MpcConductorSettings['providers']>;

interface MpcConductorOptions {
  serversByClientId: ClientServerManager['serversByClientId'];
  toolsByClientId: ClientServerManager['toolsByClientId'];
  listClientServers: ClientServerManager['findMany'];
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

export type MpcConductorUsageAnnotation = {
  type: 'planning-usage' | 'assistant-usage' | 'tool-usage';
  usage: LanguageModelUsage;
  stepIndex: number;
  provider: string;
  modelId: string;
  toolCallId?: string;
} & (
  | {
      type: 'planning-usage' | 'assistant-usage';
    }
  | {
      type: 'tool-usage';
      toolCallId: string;
    }
);

export type MpcConductorReasoningAnnotation =
  | MpcConductorReasoningStartAnnotation
  | MpcConductorReasoningFinishAnnotation;

export type MpcConductorReasoningStartAnnotation = {
  type: 'reasoning-start';
  stepIndex: number;
  name: string;
  serverId?: ServerId;
};

export type MpcConductorReasoningFinishAnnotation = {
  type: 'reasoning-finish';
  stepIndex: number;
  duration: number;
  serverId?: ServerId;
};
export type MpcConductorAnnotation = MpcConductorUsageAnnotation | MpcConductorReasoningAnnotation;

export const isUsageAnnotation = (annotation: unknown): annotation is MpcConductorUsageAnnotation => {
  return (
    typeof annotation === 'object' &&
    annotation !== null &&
    'type' in annotation &&
    typeof annotation.type === 'string' &&
    ['planning-usage', 'assistant-usage', 'tool-usage'].includes(annotation.type)
  );
};

export const isReasoningAnnotation = (annotation: unknown): annotation is MpcConductorReasoningAnnotation => {
  return (
    typeof annotation === 'object' &&
    annotation !== null &&
    'type' in annotation &&
    typeof annotation.type === 'string' &&
    ['reasoning-start', 'reasoning-finish'].includes(annotation.type)
  );
};

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
  const anthropic = createAnthropic(
    providerSettings({ provider: 'anthropic', settings: opts.settings.providers?.anthropic }),
  );

  return customProvider({
    languageModels: {
      'text-simple': openai('gpt-4o-mini'),
      text: openai('gpt-4o'),
      structure: openai('gpt-4o'),
      // planning: openai('o3-mini', { reasoningEffort: 'low' }),
      planning: wrapLanguageModel({
        model: anthropic('claude-3-7-sonnet-20250219'),
        // model: openai('o3-mini'),
        middleware: defaultSettingsMiddleware({
          settings: {
            providerMetadata: {
              anthropic: {
                thinking: { type: 'enabled', budgetTokens: 2000 }, // must be greater than 1024 tokens
              } satisfies AnthropicProviderOptions,
            },
          },
        }),
      }),
    },
  });
};

// aisdk doesn't have utils to check if a model outputs reasoning chunks yet, so keep a list here for now
const modelsWithReasoningOutput = {
  'claude-3-7-sonnet-20250219': true,
};

const agentStepsSchema = z.array(
  z.object({
    // Using the term "agent" here because it seems to help the LLM (vs "server")
    agentId: z
      .string()
      .describe('The id of the agent. This id MUST match one of the ids in the available_agents list.'),
    task: z.string().describe('A description of the task the agent will need to complete.'),
  }),
);

const agentPlanSchemaWithReasoning = z.object({
  reasoning: z
    .string()
    .describe(
      'A short description of the reasoning behind the plan. Do not solve the task here, just briefly describe why you chose the steps you did, or why you chose no steps.',
    ),
  messageToUser: z.string().describe('A message to the user that succinctly summarizes the plan.'),
  steps: agentStepsSchema,
});

const agentPlanSchema = z.object({
  messageToUser: z.string().describe('A message to the user that succinctly summarizes the plan.'),
  steps: agentStepsSchema,
});

/**
 * Our default implementation of the MpcConductor interface.
 */
export class MpcConductor {
  #serversByClientId: MpcConductorOptions['serversByClientId'];
  #toolsByClientId: MpcConductorOptions['toolsByClientId'];
  #listClientServers: MpcConductorOptions['listClientServers'];
  #callTool: MpcConductorOptions['callTool'];
  #provider: ReturnType<typeof createProvider>;
  #settings: MpcConductorSettings;
  #llmProxyUrl?: MpcConductorOptions['llmProxyUrl'];

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

  public handleMessage = async ({
    clientId,
    message,
    history = [],
    onError,
    onFinish,
    onStepFinish,
  }: MpcConductorHandleMessageOpts) => {
    return createDataStreamResponse({
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
        const clientServers = await this.#listClientServers({ clientId, enabled: true });
        const servers = await this.#serversByClientId({ clientId });
        const tools = await this.#toolsByClientId({ clientId, lazyConnect: true });

        const flow = new AgentFlow({
          clientId,
          message,
          history,
          clientServers,
          servers,
          tools,
          provider: this.#provider,
          callTool: this.#callTool,
          dataStream,
          onError,
          onFinish,
          onStepFinish,
        });

        await flow.run();
      },
    });
  };

  public async updateSettings(settings: MpcConductorSettings) {
    this.#settings = settings;
    this.#provider = this.#initProvider();
  }

  #initProvider() {
    return createProvider({ settings: this.#settings, llmProxyUrl: this.#llmProxyUrl });
  }
}

const generateOutputSchemaSystemMessage = ({ schema }: { schema: z.ZodSchema }) => {
  /**
   * The aisdk experimental_output feature does something similar to this for models that don't support structured outputs,
   * except they are not as forceful about not returning other formats. In testing, found that claude 3.7 would wrap the json object in a markdown code block.
   * If we change the below, make sure that things work as expected with claude 3.7.
   */
  return {
    role: 'system' as const,
    content: dedent`
      IMPORTANT: return a valid JSON object that conforms to the JSON schema below. Do not return any other text or formatting, and it is VERY IMPORTANT that you NEVER wrap your response in markdown code blocks.

      <output_schema>
      ${JSON.stringify(zodSchema(schema).jsonSchema, null, 2)}
      </output_schema>
    `,
  };
};

interface AgentFlowOptions {
  clientId: ClientId;
  message: UIMessage;
  history: UIMessage[];
  clientServers: ClientServer[];
  servers: Server[];
  tools: Tool[];
  provider: ReturnType<typeof createProvider>;
  callTool: MpcConductorOptions['callTool'];
  dataStream: DataStreamWriter;
  onError?: MpcConductorHandleMessageOpts['onError'];
  onFinish?: MpcConductorHandleMessageOpts['onFinish'];
  onStepFinish?: MpcConductorHandleMessageOpts['onStepFinish'];
}

class AgentFlow {
  #clientId: ClientId;
  #message: UIMessage;
  #history: UIMessage[];
  #clientServers: ClientServer[];
  #servers: Server[];
  #tools: Tool[];
  #provider: ReturnType<typeof createProvider>;
  #callTool: MpcConductorOptions['callTool'];
  #dataStream: DataStreamWriter;
  #onError?: MpcConductorHandleMessageOpts['onError'];
  #onFinish?: MpcConductorHandleMessageOpts['onFinish'];
  #onStepFinish?: MpcConductorHandleMessageOpts['onStepFinish'];

  #currentStepIndex = 0;

  constructor(options: AgentFlowOptions) {
    this.#clientId = options.clientId;
    this.#message = options.message;
    this.#history = options.history;
    this.#clientServers = options.clientServers;
    this.#servers = options.servers;
    this.#tools = options.tools;
    this.#provider = options.provider;
    this.#callTool = options.callTool;
    this.#dataStream = options.dataStream;
    this.#onError = options.onError;
    this.#onFinish = options.onFinish;
    this.#onStepFinish = options.onStepFinish;
  }

  public async run() {
    const plan = await this.createPlan();

    const stepMessages: UIMessage[] = [];
    for (const step of plan.steps) {
      const clientServer = this.#clientServers.find(cs => cs.serverId === step.agentId);
      if (!clientServer) {
        throw new Error(`Client server "${step.agentId}" not found`);
      }

      const server = this.#servers.find(s => s.id === step.agentId);
      if (!server) {
        throw new Error(`Server "${step.agentId}" not found`);
      }

      const stepMessage = await this.runPlanStep({
        step,
        clientServer,
        server,
      });

      stepMessages.push(stepMessage);
    }

    const textModel = this.#provider.languageModel('text');

    // If the message was complex enough to require a plan, one more step at the end to wrap it up
    if (plan.steps.length) {
      const result = streamText({
        model: textModel,
        messages: [...this.#history, ...stepMessages, this.#message],
        onError: this.#onError,
        onStepFinish: this.#onStepFinish,
        onFinish: event => {
          this.#writeUsageAnnotation({
            type: 'assistant-usage',
            usage: event.usage,
            provider: textModel.provider,
            modelId: textModel.modelId,
          });

          return this.#onFinish?.(event);
        },
      });

      result.mergeIntoDataStream(this.#dataStream, { experimental_sendStart: false, experimental_sendFinish: true });
    }
  }

  private async createPlan() {
    const planningModel = this.#provider.languageModel('planning');

    const hasNativeReasoning = modelsWithReasoningOutput[planningModel.modelId];

    // If the model supports reasoning chunks, use the simple schema, otherwise use the schema that includes simulated "reasoning" prop in the output
    const output = Output.object({ schema: hasNativeReasoning ? agentPlanSchema : agentPlanSchemaWithReasoning });

    const systemMessages: CoreSystemMessage[] = [];

    systemMessages.push({
      role: 'system',
      content: dedent`
        You are an AI assistant tasked with creating a plan to address the user's message by utilizing the available agents, if necessary.

        - Think through the user's request, and create a plan that lists the steps required to fulfill the request, along with the agent that must complete the step.
        - If the user's request is simple and can be fulfilled without the help of any of these agents (for example, from data in the message history), return an empty steps array.
        - If you believe any part of the user's request requires an agent that is not listed below, add a step with agentId "unknown" and a task that describes the part of the request that requires the missing agent.
        - Each step will have access to the information from prior steps, try not to add steps that essentially duplicate themselves.

        Below is the list of available agents that you can use in your plan:

        <available_agents>
        ${JSON.stringify(this.#servers.map(t => ({ id: t.id, name: t.name })))}
        </available_agents>
      `,
    });

    if (!planningModel.supportsStructuredOutputs) {
      systemMessages.push(generateOutputSchemaSystemMessage({ schema: agentPlanSchema }));
    }

    this.#startStep();

    this.#writeReasoningAnnotation({ type: 'reasoning-start', name: 'Planner' });

    let text = '';
    let reasoningText = '';
    let messageToUserText = '';
    let reasoningStart = Date.now();
    let reasoningEnd = Date.now();
    const dataStream = this.#dataStream; // Create a local reference
    const planStream = await streamText({
      model: planningModel,
      messages: [...systemMessages, ...this.#history, this.#message],
      experimental_output: planningModel.supportsStructuredOutputs ? output : undefined,
      onChunk({ chunk }) {
        if (chunk.type === 'text-delta') {
          reasoningEnd = Date.now();

          text += chunk.textDelta;

          const parsed = output.parsePartial({ text });
          if (!parsed?.partial) return;

          // If this model doesn't formally support reasoning, we can
          // simulate it by writing the reasoning property from the actual response to the stream
          if (!hasNativeReasoning) {
            const partial = parsed?.partial as z.infer<typeof agentPlanSchemaWithReasoning> | undefined;
            if (partial?.reasoning && partial.reasoning !== reasoningText) {
              const delta = partial.reasoning.substring(reasoningText.length);
              reasoningText = partial.reasoning;
              dataStream.write(formatDataStreamPart('reasoning', delta));
            }
          }

          const partial = parsed?.partial as z.infer<typeof agentPlanSchema> | undefined;
          if (partial?.messageToUser && partial.messageToUser !== messageToUserText) {
            const delta = partial.messageToUser.substring(messageToUserText.length);
            messageToUserText = partial.messageToUser;
            dataStream.write(formatDataStreamPart('text', delta));
          }
        } else if (chunk.type === 'reasoning') {
          dataStream.write(formatDataStreamPart('reasoning', chunk.textDelta));
        }
      },
    });

    await planStream.consumeStream();

    this.#writeUsageAnnotation({
      type: 'planning-usage',
      usage: await planStream.usage,
      provider: planningModel.provider,
      modelId: planningModel.modelId,
    });

    this.#writeReasoningAnnotation({ type: 'reasoning-finish', duration: reasoningEnd - reasoningStart });

    // @TODO if parse fails, attempt to strip markdown code block from start/end and try again, since
    // models that don't support structured outputs might wrap the response in a markdown code block
    const plan = JSON.parse(text) as z.infer<typeof agentPlanSchema>;

    console.log('createPlan', { plan });

    this.#finishStep();

    return plan;
  }

  private async runPlanStep({
    step,
    clientServer,
    server,
  }: {
    step: z.infer<typeof agentPlanSchema>['steps'][number];
    clientServer: ClientServer;
    server: Server;
  }) {
    const tools = this.#tools.filter(t => t.server === server.id);

    const safeClientServerConfig = _cloneDeep(clientServer.serverConfig);
    for (const key in server.configSchema?.properties) {
      const val = server.configSchema?.properties[key];
      if (val?.format === 'secret') {
        delete safeClientServerConfig[key];
      }
    }

    const plan = await this.createStepPlan({
      step,
      clientServerConfig: safeClientServerConfig,
      server,
      tools,
    });

    const stepMessage: UIMessage = {
      id: nanoid(),
      role: 'assistant',
      content: '',
      parts: [],
    };

    for (const step of plan.steps) {
      const toolCallId = nanoid();

      const tool = tools.find(t => t.name === step.tool);
      if (!tool) {
        throw new Error(`Tool "${step.tool}" not found for server "${server.id}"`);
      }

      const toolId = `${server.id}__${step.tool}`;

      console.log(`${toolId} - runPlanStep`, { tool });

      const structureModel = this.#provider.languageModel('structure');

      this.#dataStream.write(
        formatDataStreamPart('tool_call_streaming_start', {
          toolCallId,
          toolName: toolId,
        }),
      );

      const { object: toolCallObj, usage: toolCallUsage } = await generateObject({
        model: structureModel,
        system: dedent`
          A request is being made to a tool named "${tool.name}". ${tool.description ? `This tool is described as "${tool.description}".` : ''}

          Use the message history, the tool's description, the provided client server config, and the tool's input schema to generate an input object that matches the tool's input schema.

          This input object will be passed to the tool to accomplish the requested task.

          IMPORTANT:

          1. Ignore tool input properties the are used for authentication, we will handle that separately.
          2. With the exception of auth properties mentioned in point 1, the input object MUST be valid according to the tool's input schema
          3. If the tool requires a property and it looks like that property, or something very similarly named, is in the client_server_config below, fallback to that value if nothing better is available.
          4. If the tool input requires a property that is not available in the message history or the client server config below, and that must be supplied by the user, add a message requesting the missing property to the 'collectFromUser' array. DO NOT add the property to the collectFromUser array if it is optional, or is related to authentication.

          Here is the tool's input schema:

          <tool_input_schema>
          ${JSON.stringify(tool.inputSchema, null, 2)}
          </tool_input_schema>

          Here is the client server config:

          <client_server_config>
          ${JSON.stringify(safeClientServerConfig, null, 2)}
          </client_server_config>

          Todays date is ${new Date().toLocaleString()}.
        `,

        messages: [...this.#history, stepMessage, { role: 'user', content: step.task }],

        schema: jsonSchema({
          type: 'object',
          properties: {
            toolInput: tool.inputSchema,
            collectFromUser: {
              type: 'array',
              description:
                'An array of properties that must be supplied by the user. For example, if the user asks to send a message to "my boss" in slack, and it is not apparent from the message history who "my boss" is, we must ask them for the slack username of their boss.',
              items: {
                type: 'string',
              },
            },
          },
          required: ['toolInput'],
        }),
      });

      this.#writeUsageAnnotation({
        type: 'tool-usage',
        toolCallId,
        usage: toolCallUsage,
        provider: structureModel.provider,
        modelId: structureModel.modelId,
      });

      console.log(`${toolId} - runPlanStep`, { toolCallObj });

      const toolInput = (toolCallObj as any).toolInput ?? {};
      const collectFromUser = (toolCallObj as any).collectFromUser ?? [];

      if (collectFromUser.length) {
        console.log('COLLECT FROM USER', { collectFromUser });
        // @TODO need to break out of the loops and re-prompt the user for the missing properties
      }

      this.#dataStream.write(
        formatDataStreamPart('tool_call', {
          toolCallId,
          toolName: toolId,
          args: toolInput,
        }),
      );

      const toolResult = await this.#callTool({
        clientId: this.#clientId,
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
        system: dedent`
          A request was just made to a tool named "${tool.name}". ${tool.description ? `This tool is described as "${tool.description}".` : ''}

          We need to use the tool's description, the user's message history, and the provided truncated tool output.

          The json path expression(s) that you generate will be used on the full tool output to extract the minimum data needed to answer the user's request.

          - The goal is to reduce the size of the response, while still being able to fulfill the user's request.
          - If you believe that the data retrieved from the primary json path may not be sufficient to answer the user's request, you can provide secondary json paths.
          - The JSON path that you provide MUST BE A VALID JSON PATH FOR THE GIVEN ABREVIATED TOOL OUTPUT.
          - IMPORTANT: Air on the side of simpler JSON path expressions if possible. It is better to use a simpler json path expression that results in a larger data set than to use a complex json path expression that might not work.
          - IMPORTANT: avoid using json path filter expressions like $.data.results[?(@.name == "John")].id, instead use $.data.results[*].id which is safer even if it retrieves more data. Use secondaryJsonPaths if you need multiple properties.

          <abbreviated_tool_output>
          ${JSON.stringify(trimmedResult)}
          </abbreviated_tool_output>
        `,

        messages: [...this.#history, { role: 'user', content: step.task }],

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

      this.#dataStream.write(
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
          args: toolInput ?? {},
          result: toolResultContent,
        },
      });
    }

    return stepMessage;
  }

  private async createStepPlan({
    step,
    clientServerConfig,
    server,
    tools,
  }: {
    step: z.infer<typeof agentPlanSchema>['steps'][number];
    clientServerConfig: ClientServer['serverConfig'];
    server: Server;
    tools: Tool[];
  }) {
    const stepsSchema = z.array(
      z.object({
        task: z
          .string()
          .describe(
            'A short and helpful description of what the agent needs to accomplish in this step. Remember that the agent has access to the message history, so you do not need to repeat any of that here',
          ),
        tool: z
          .string()
          .describe('The name of the tool to use. This name MUST BE ONE of the names in the available_tools list.'),
      }),
    );

    const planSchema = z.object({
      steps: stepsSchema,
    });

    const planSchemaWithReasoning = z.object({
      reasoning: z
        .string()
        .describe(
          'A short description of the reasoning behind the plan. Do not solve the task here, just briefly describe why you chose the steps you did, or why you chose no steps.',
        ),
      steps: stepsSchema,
    });

    const planningModel = this.#provider.languageModel('planning');

    const hasNativeReasoning = modelsWithReasoningOutput[planningModel.modelId];

    // If the model supports reasoning chunks, use the simple schema, otherwise use the schema that includes simulated "reasoning" prop in the output
    const output = Output.object({ schema: hasNativeReasoning ? planSchema : planSchemaWithReasoning });

    const systemMessages: CoreSystemMessage[] = [];

    systemMessages.push({
      role: 'system',
      content: dedent`
        You are an AI assistant specialized to work with ${server.name}. You are tasked with creating a plan to address the requested task by utilizing the available tools, if necessary.

        - Create a plan that specifies a sequence of tools to use.
        - If the user's request can be fulfilled without using any tools (for example, from data in the message history), you should return an empty array.
        - You may need to use multiple tools to fulfill the task.
        - You may need to use the same tool multiple times in the plan.
        - IMPORTANT: each step has access to the information from prior steps, try not to add steps that essentially duplicate themselves
        - IMPORTANT: consider each tool carefully to generate a plan that requires the least number of steps possible

        Below is the list of available tools with their descriptions:

        <available_tools>
        ${JSON.stringify(tools.map(t => ({ name: t.name, description: t.description })))}
        </available_tools>

        Here is the extra configuration associated with this server, in case it is helpful. It will be made available to each step of the plan.

        <client_server_config>
        ${JSON.stringify(clientServerConfig, null, 2)}
        </client_server_config>
      `,
    });

    if (!planningModel.supportsStructuredOutputs) {
      systemMessages.push(generateOutputSchemaSystemMessage({ schema: planSchema }));
    }

    const message: CoreUserMessage = {
      role: 'user',
      content: `Create a plan to fulfill the following task: "${step.task}"`,
    };

    this.#startStep();

    this.#writeReasoningAnnotation({ type: 'reasoning-start', name: server.name, serverId: server.id });

    let text = '';
    let reasoningText = '';
    let reasoningStart = Date.now();
    let reasoningEnd = Date.now();
    const dataStream = this.#dataStream; // Create a local reference
    const planStream = await streamText({
      model: planningModel,
      messages: [...systemMessages, message],
      experimental_output: planningModel.supportsStructuredOutputs ? output : undefined,
      onChunk({ chunk }) {
        if (chunk.type === 'text-delta') {
          reasoningEnd = Date.now();

          text += chunk.textDelta;

          const parsed = output.parsePartial({ text });
          if (!parsed?.partial) return;

          // If this model doesn't formally support reasoning, we can
          // simulate it by writing the reasoning property from the actual response to the stream
          if (!hasNativeReasoning) {
            const partial = parsed?.partial as z.infer<typeof planSchemaWithReasoning> | undefined;
            if (partial?.reasoning && partial.reasoning !== reasoningText) {
              const delta = partial.reasoning.substring(reasoningText.length);
              reasoningText = partial.reasoning;
              dataStream.write(formatDataStreamPart('reasoning', delta));
            }
          }

          // const partial = parsed?.partial as z.infer<typeof planSchema> | undefined;
          // if (partial?.messageToUser && partial.messageToUser !== messageToUserText) {
          //   messageToUserText = partial.messageToUser;
          //   dataStream.write(formatDataStreamPart('text', messageToUserText));
          // }
        } else if (chunk.type === 'reasoning') {
          dataStream.write(formatDataStreamPart('reasoning', chunk.textDelta));
        }
      },
    });

    await planStream.consumeStream();

    console.log(`${server.id} - createStepPlan`, { step, text });

    const plan = JSON.parse(text) as z.infer<typeof planSchema>;

    this.#writeUsageAnnotation({
      type: 'planning-usage',
      usage: await planStream.usage,
      provider: planningModel.provider,
      modelId: planningModel.modelId,
    });

    this.#writeReasoningAnnotation({ type: 'reasoning-finish', duration: reasoningEnd - reasoningStart });

    this.#finishStep();

    return plan;
  }

  #writeUsageAnnotation = (annotation: Omit<MpcConductorUsageAnnotation, 'stepIndex'>) => {
    this.#dataStream.writeMessageAnnotation({
      ...annotation,
      stepIndex: this.#currentStepIndex,
    });
  };

  #writeReasoningAnnotation = (
    annotation:
      | Omit<MpcConductorReasoningStartAnnotation, 'stepIndex'>
      | Omit<MpcConductorReasoningFinishAnnotation, 'stepIndex'>,
  ) => {
    this.#dataStream.writeMessageAnnotation({
      ...annotation,
      stepIndex: this.#currentStepIndex,
    });
  };

  /**
   *
   */
  #startStep = () => {
    // @TODO not sure what messageId is for here... doesn't seem to do anything
    // start a new step - otherwise all text and reasoning chunks across the entire conductor run end up merged into one message part
    this.#dataStream.write(formatDataStreamPart('start_step', { messageId: '1234' }));
  };

  #finishStep = ({
    finishReason = 'stop',
    isContinued = false,
    usage,
  }: {
    finishReason?: LanguageModelV1FinishReason;
    isContinued?: boolean;
    usage?: {
      promptTokens: number;
      completionTokens: number;
    };
  } = {}) => {
    this.#currentStepIndex++;
    this.#dataStream.write(formatDataStreamPart('finish_step', { finishReason, isContinued, usage }));
  };
}
