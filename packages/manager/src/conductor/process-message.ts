import type { LanguageModelV1FinishReason } from '@ai-sdk/provider';
import { traverse } from '@stoplight/json';
import {
  APICallError,
  type CoreSystemMessage,
  type CoreUserMessage,
  type DataStreamWriter,
  formatDataStreamPart,
  generateObject,
  jsonSchema,
  Output,
  streamText,
  type UIMessage,
  zodSchema,
} from 'ai';
import dedent from 'dedent';
import { batchExec, type Callback } from 'jsonpath-rfc9535';
import _cloneDeep from 'lodash/cloneDeep';
import _set from 'lodash/set';
import { nanoid } from 'nanoid';
import type { Result } from 'neverthrow';
import { err, ok } from 'neverthrow';
import { z } from 'zod';

import type { ClientServer, ClientServerManager, Tool } from '../client-servers.ts';
import type { Server } from '../servers.ts';
import type { ClientId, ServerId } from '../types.ts';
import type {
  MpcConductorReasoningFinishAnnotation,
  MpcConductorReasoningStartAnnotation,
  MpcConductorUsageAnnotation,
} from './annotations.ts';
import * as errors from './errors.ts';
import type { MpcConductorProvider } from './provider.ts';

// Processes a user message by coordinating work across multiple agents and tools
export async function processMessage({
  clientId,
  message,
  history = [],
  clientServers,
  servers,
  tools,
  provider,
  callTool,
  dataStream,
}: {
  clientId: ClientId;
  message: UIMessage;
  history: UIMessage[];
  clientServers: ClientServer[];
  servers: Server[];
  tools: Tool[];
  provider: MpcConductorProvider;
  callTool: ClientServerManager['callTool'];
  dataStream: DataStreamWriter;
}): Promise<Result<void, errors.ConductorError>> {
  const processor = new MessageProcessor({
    clientId,
    message,
    history,
    clientServers,
    servers,
    tools,
    provider,
    callTool,
    dataStream,
  });

  return processor.process();
}

// ==================== Schemas ====================

// aisdk doesn't have utils to check if a model outputs reasoning chunks yet, so keep a list here for now
const MODELS_WITH_REASONING_OUTPUT = {
  'claude-3-7-sonnet-20250219': true,
};

// Schema definitions - centralized for easier reference
const Schemas = {
  // Schema for representing individual steps in an agent plan
  agentSteps: z.array(
    z.object({
      agentId: z
        .string()
        .describe('The id of the agent. This id MUST match one of the ids in the available_agents list.'),
      task: z.string().describe('A description of the task the agent will need to complete.'),
    }),
  ),

  // Schema with reasoning for plans
  agentPlanWithReasoning: z.object({
    reasoning: z
      .string()
      .describe(
        'A short description of the reasoning behind the plan. Do not solve the task here, just briefly describe why you chose the steps you did, or why you chose no steps.',
      ),
    messageToUser: z.string().describe('A message to the user that succinctly summarizes the plan.'),
    steps: z.lazy(() => Schemas.agentSteps),
  }),

  // Schema without reasoning for plans
  agentPlan: z.object({
    messageToUser: z.string().describe('A message to the user that succinctly summarizes the plan.'),
    steps: z.lazy(() => Schemas.agentSteps),
  }),

  // Schema for tool steps
  toolSteps: z.array(
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
  ),

  // Schema for tool sequence with reasoning
  toolSequenceWithReasoning: z.object({
    reasoning: z
      .string()
      .describe(
        'A short description of the reasoning behind the plan. Do not solve the task here, just briefly describe why you chose the steps you did, or why you chose no steps.',
      ),
    steps: z.lazy(() => Schemas.toolSteps),
  }),

  // Schema for tool sequence without reasoning
  toolSequence: z.object({
    steps: z.lazy(() => Schemas.toolSteps),
  }),

  // Schema for tool output paths
  toolOutputPaths: z.object({
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
} as const;

// ==================== Helper Functions ====================

function generateOutputSchemaSystemMessage({ schema }: { schema: z.ZodSchema }): CoreSystemMessage {
  /**
   * The aisdk experimental_output feature does something similar to this for models that don't support structured outputs,
   * except they are not as forceful about not returning other formats. In testing, found that claude 3.7 would wrap the json object in a markdown code block.
   * If we change the below, make sure that things work as expected with claude 3.7.
   */
  return {
    role: 'system',
    content: dedent`
      IMPORTANT: return a valid JSON object that conforms to the JSON schema below. Do not return any other text or formatting, and it is VERY IMPORTANT that you NEVER wrap your response in markdown code blocks.

      <output_schema>
      ${JSON.stringify(zodSchema(schema), null, 2)}
      </output_schema>
    `,
  };
}

// Removes all parts of type "reasoning" from the messages without mutating the original
// See this issue for more context on why we are doing this: https://github.com/vercel/ai/discussions/5480
function removeReasoningParts(messages: UIMessage[]): UIMessage[] {
  return messages
    .map(message => {
      if (!message.parts?.length) return message;

      // Deep clone the message to avoid mutation
      const newMessage = _cloneDeep(message);

      newMessage.parts = newMessage.parts.filter(
        part => !['reasoning', 'step-start', 'step-finish'].includes(part.type),
      );

      // No parts means no content, and apis like anthropic will throw an error if any messages have empty content
      if (newMessage.parts.length === 0) return null;

      return newMessage;
    })
    .filter(m => m !== null);
}

// Creates a safe copy of client server config with secrets removed
function createSafeClientServerConfig(clientServer: ClientServer, server: Server): ClientServer['serverConfig'] {
  const safeClientServerConfig = _cloneDeep(clientServer.serverConfig);

  for (const key in server.configSchema?.properties) {
    const val = server.configSchema?.properties[key];
    if (val?.format === 'secret') {
      delete safeClientServerConfig[key];
    }
  }

  return safeClientServerConfig;
}

// Processes JSON paths and extracts data from the tool result
function processJsonPaths<T extends Record<string, unknown>>(
  toolResultContent: T,
  toolOutputPaths: z.infer<typeof Schemas.toolOutputPaths>,
): Result<T, errors.PickError<errors.ConductorError, 'Other'>> {
  const summarizedResult = {} as T;
  const jsonPathCallbacks = new Map<string, Callback>();

  // Set up primary JSON path callback
  if (toolOutputPaths.primaryJsonPath) {
    jsonPathCallbacks.set(toolOutputPaths.primaryJsonPath, (value, path) => {
      _set(summarizedResult, path, value);
    });
  }

  // Set up secondary JSON path callbacks
  if (toolOutputPaths.secondaryJsonPaths) {
    for (const secondaryJsonPath of toolOutputPaths.secondaryJsonPaths) {
      if (!secondaryJsonPath) continue;

      jsonPathCallbacks.set(secondaryJsonPath, (value, path) => {
        _set(summarizedResult, path, value);
      });
    }
  }

  try {
    batchExec(
      // @ts-expect-error ignore
      toolResultContent,
      jsonPathCallbacks,
    );
  } catch (error) {
    console.error('processJsonPaths.error', { error, toolOutputPaths, toolResultContent });
    return err(errors.other({ message: 'Error processing JSON paths', error }));
  }

  return ok(Object.keys(summarizedResult).length ? summarizedResult : toolResultContent);
}

// Creates a trimmed version of the tool result for prompt construction, to reduce token usage
function createTrimmedToolResult<T extends Record<string, unknown>>(toolResultContent: T) {
  const trimmedResult = _cloneDeep(toolResultContent);

  traverse(trimmedResult, {
    onProperty: ({ parent, property, propertyValue }) => {
      if (Array.isArray(propertyValue)) {
        _set(parent, property, propertyValue.slice(0, 1));
      }
    },
  });

  return trimmedResult;
}

class MessageProcessor {
  private readonly clientId: ClientId;
  private readonly message: UIMessage;
  private readonly history: UIMessage[];
  private readonly clientServers: ClientServer[];
  private readonly servers: Server[];
  private readonly tools: Tool[];
  private readonly provider: MpcConductorProvider;
  private readonly callTool: ClientServerManager['callTool'];
  private readonly dataStream: DataStreamWriter;

  private readonly messageId: string;
  private currentStepIndex: number;

  constructor({
    clientId,
    message,
    history = [],
    clientServers,
    servers,
    tools,
    provider,
    callTool,
    dataStream,
  }: {
    clientId: ClientId;
    message: UIMessage;
    history: UIMessage[];
    clientServers: ClientServer[];
    servers: Server[];
    tools: Tool[];
    provider: MpcConductorProvider;
    callTool: ClientServerManager['callTool'];
    dataStream: DataStreamWriter;
  }) {
    this.clientId = clientId;
    this.message = message;
    this.history = removeReasoningParts(history);
    this.clientServers = clientServers;
    this.servers = servers;
    this.tools = tools;
    this.provider = provider;
    this.callTool = callTool;
    this.dataStream = dataStream;

    this.messageId = nanoid();
    this.currentStepIndex = 0;
  }

  public async process(): Promise<Result<void, errors.ConductorError>> {
    const workflow = await this.createAgentWorkflow();
    if (workflow.isErr()) {
      return err(workflow.error);
    }

    // Execute each agent task in the workflow
    const agentMessages: UIMessage[] = [];
    for (const agentTask of workflow.value.steps) {
      // Find the client server and server for this task
      const clientServer = this.clientServers.find(cs => cs.serverId === agentTask.agentId);
      if (!clientServer) {
        return err(errors.clientServerNotFound({ serverId: agentTask.agentId }));
      }

      const server = this.servers.find(s => s.id === agentTask.agentId);
      if (!server) {
        return err(errors.serverNotFound({ serverId: agentTask.agentId }));
      }

      // Execute the agent task
      const agentMessageResult = await this.executeAgentTask({
        agentTask,
        clientServer,
        server,
      });

      if (agentMessageResult.isErr()) {
        return err(agentMessageResult.error);
      }

      agentMessages.push(agentMessageResult.value);
    }

    // If the workflow had steps, add a final step to summarize
    if (workflow.value.steps.length) {
      const textModel = this.provider.languageModel('text');

      const result = streamText({
        model: textModel,
        messages: [...this.history, ...agentMessages, this.message],
        onFinish: event => {
          this.writeUsageAnnotation({
            type: 'assistant-usage',
            usage: event.usage,
            provider: textModel.provider,
            modelId: textModel.modelId,
          });
        },
      });

      result.mergeIntoDataStream(this.dataStream, { experimental_sendStart: false, experimental_sendFinish: true });
    }

    return ok();
  }

  // ---- Stream annotation and step management ----

  private writeUsageAnnotation(annotation: Omit<MpcConductorUsageAnnotation, 'stepIndex'>) {
    this.dataStream.writeMessageAnnotation({
      ...annotation,
      stepIndex: this.currentStepIndex,
    });
  }

  private writeReasoningAnnotation(
    annotation:
      | Omit<MpcConductorReasoningStartAnnotation, 'stepIndex'>
      | Omit<MpcConductorReasoningFinishAnnotation, 'stepIndex'>,
  ) {
    this.dataStream.writeMessageAnnotation({
      ...annotation,
      stepIndex: this.currentStepIndex,
    });
  }

  private startStep() {
    // TBH I'm not exactly sure how messageId is used by start_step, and how this messageId is tied through the entire message... this is the only place we pass it
    // start a new step - otherwise all text and reasoning chunks across the entire conductor run end up merged into one message part
    this.dataStream.write(formatDataStreamPart('start_step', { messageId: this.messageId }));
  }

  private finishStep({
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
  } = {}) {
    this.currentStepIndex++;
    this.dataStream.write(formatDataStreamPart('finish_step', { finishReason, isContinued, usage }));
  }

  // ---- Core LLM interaction logic ----

  // Streams structured output from a model with support for reasoning chunks
  private async streamWithReasoning<T extends z.ZodSchema, U extends z.ZodSchema>({
    model,
    systemMessages,
    messages,
    outputSchema,
    logPrefix,
    reasoning,
  }: {
    model: ReturnType<MpcConductorProvider['languageModel']>;
    systemMessages: CoreSystemMessage[];
    messages: (CoreUserMessage | UIMessage)[];
    outputSchema: ReturnType<typeof Output.object>;
    logPrefix: string;
    reasoning: {
      name: string;
      serverId?: ServerId;
      withSchema: U;
      onPartialParsed?: (partial: any) => void;
    };
  }): Promise<Result<z.infer<T>, errors.ConductorError>> {
    const hasNativeReasoning = MODELS_WITH_REASONING_OUTPUT[model.modelId];

    this.startStep();
    this.writeReasoningAnnotation({ type: 'reasoning-start', name: reasoning.name, serverId: reasoning.serverId });

    let text = '';
    let reasoningText = '';
    let reasoningStart = Date.now();
    let reasoningEnd = Date.now();
    let textPartCount = 0;

    const { fullStream, usage } = streamText({
      model,
      // @ts-expect-error ignore
      messages: [...systemMessages, ...messages],
      experimental_output: model.supportsStructuredOutputs ? outputSchema : undefined,
    });

    try {
      for await (const chunk of fullStream) {
        if (chunk.type === 'error') {
          throw chunk.error;
        }

        if (chunk.type === 'text-delta') {
          reasoningEnd = Date.now();
          text += chunk.textDelta;

          if (textPartCount === 0) {
            text = text.trimStart();
            // Check if the response starts with anything other than a JSON object or array
            if (!text.startsWith('{') && !text.startsWith('[')) {
              // Remove any non-JSON prefix (like markdown code blocks)
              text = text.replace(/^[\s\S]*?([[{])/, '$1');
            }
          }

          textPartCount++;

          const parsed = outputSchema.parsePartial({ text });
          if (!parsed?.partial) continue;

          // If model doesn't support reasoning chunks, simulate it from the response
          if (!hasNativeReasoning) {
            const partial = parsed?.partial as z.infer<typeof reasoning.withSchema> | undefined;
            if (partial?.reasoning && partial.reasoning !== reasoningText) {
              const delta = partial.reasoning.substring(reasoningText.length);
              reasoningText = partial.reasoning;
              this.dataStream.write(formatDataStreamPart('reasoning', delta));
            }
          }

          reasoning.onPartialParsed?.(parsed.partial as z.infer<T>);

          continue;
        }

        if (chunk.type === 'reasoning') {
          this.dataStream.write(formatDataStreamPart('reasoning', chunk.textDelta));

          continue;
        }
      }
    } catch (error) {
      console.error(`${logPrefix}.streamError`, { streamError: error });
      this.writeReasoningAnnotation({ type: 'reasoning-finish', duration: reasoningEnd - reasoningStart });
      this.finishStep();

      if (APICallError.isInstance(error)) {
        return err(errors.llmApiCall({ provider: model.provider, error }));
      }

      return err(errors.stream({ message: `Stream error in ${logPrefix}`, error }));
    }

    // Clean up any trailing non-JSON content
    text = text.trimEnd();
    if (!text.endsWith('}') && !text.endsWith(']')) {
      text = text.replace(/[}\]]([\s\S]*)$/, '$1');
    }

    console.log(`${logPrefix}.finalText`, { text });

    let plan: z.infer<T>;
    try {
      plan = JSON.parse(text) as z.infer<T>;
    } catch (error) {
      console.error(`${logPrefix}.parseError`, { error, text });
      this.writeReasoningAnnotation({ type: 'reasoning-finish', duration: reasoningEnd - reasoningStart });
      this.finishStep();
      return err(errors.llmOutputParse({ text }));
    }

    this.writeUsageAnnotation({
      type: 'planning-usage',
      usage: await usage,
      provider: model.provider,
      modelId: model.modelId,
    });

    this.writeReasoningAnnotation({ type: 'reasoning-finish', duration: reasoningEnd - reasoningStart });
    this.finishStep();

    return ok(plan);
  }

  // ---- Plan generation and execution ----

  // Creates a simplistic "workflow" defining which agents should handle the user's request
  private createAgentWorkflow(): Promise<Result<z.infer<typeof Schemas.agentPlan>, errors.ConductorError>> {
    const planningModel = this.provider.languageModel('planning');
    const hasNativeReasoning = MODELS_WITH_REASONING_OUTPUT[planningModel.modelId];

    // Use appropriate schema based on model capabilities
    const output = Output.object({
      schema: hasNativeReasoning ? Schemas.agentPlan : Schemas.agentPlanWithReasoning,
    });

    const systemMessages: CoreSystemMessage[] = [];

    // Add main system prompt with instructions for the planner
    systemMessages.push({
      role: 'system',
      content: dedent`
        You are an AI assistant tasked with creating a plan to address the user's message by utilizing the available agents, if necessary.

        - Think through the user's request, and create a plan that lists the steps required to fulfill the request, along with the agent that must complete the step.
        - If the user's request is simple and can be fulfilled without the help of any of these agents (for example, from data in the message history), the resulting steps array should be empty, and you can reply to the user directly in the messageToUser property.
        - If you believe any part of the user's request requires an agent that is not listed below, add a step with agentId "unknown" and a task that describes the part of the request that requires the missing agent.
        - Each step will have access to the information from prior steps, try not to add steps that duplicate themselves.

        Below is the list of available agents that you can use in your plan:

        <available_agents>
        ${JSON.stringify(this.servers.map(t => ({ id: t.id, name: t.name })))}
        </available_agents>
      `,
    });

    // Add schema guidance for models that don't support structured outputs
    if (!planningModel.supportsStructuredOutputs) {
      systemMessages.push(generateOutputSchemaSystemMessage({ schema: Schemas.agentPlan }));
    }

    let messageToUserText = '';

    return this.streamWithReasoning<typeof Schemas.agentPlan, typeof Schemas.agentPlanWithReasoning>({
      model: planningModel,
      systemMessages,
      messages: [...this.history, this.message],
      outputSchema: output,
      logPrefix: 'createAgentWorkflow',
      reasoning: {
        name: 'Planner',
        withSchema: Schemas.agentPlanWithReasoning,
        onPartialParsed: partial => {
          // Stream message to user as it's generated
          if (partial?.messageToUser && partial.messageToUser !== messageToUserText) {
            const delta = partial.messageToUser.substring(messageToUserText.length);
            messageToUserText = partial.messageToUser;
            this.dataStream.write(formatDataStreamPart('text', delta));
          }
        },
      },
    });
  }

  // Creates a sequence of tool calls for a specific agent task
  private async createToolSequence({
    agentTask,
    clientServerConfig,
    server,
    tools: agentTools,
  }: {
    agentTask: z.infer<typeof Schemas.agentPlan>['steps'][number];
    clientServerConfig: ClientServer['serverConfig'];
    server: Server;
    tools: Tool[];
  }) {
    const planningModel = this.provider.languageModel('planning');
    const hasNativeReasoning = MODELS_WITH_REASONING_OUTPUT[planningModel.modelId];

    // If the model supports reasoning chunks, use the simple schema, otherwise use the schema that includes simulated "reasoning" prop in the output
    const output = Output.object({
      schema: hasNativeReasoning ? Schemas.toolSequence : Schemas.toolSequenceWithReasoning,
    });

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
        ${JSON.stringify(agentTools.map(t => ({ name: t.name, description: t.description })))}
        </available_tools>

        Here is the extra configuration associated with this server, in case it is helpful. It will be made available to each step of the plan.

        <client_server_config>
        ${JSON.stringify(clientServerConfig, null, 2)}
        </client_server_config>
      `,
    });

    // Add schema guidance for models that don't support structured outputs
    if (!planningModel.supportsStructuredOutputs) {
      systemMessages.push(generateOutputSchemaSystemMessage({ schema: Schemas.toolSequence }));
    }

    const message: CoreUserMessage = {
      role: 'user',
      content: `Create a plan to fulfill the following task: "${agentTask.task}"`,
    };

    const toolSequenceResult = await this.streamWithReasoning<
      typeof Schemas.toolSequence,
      typeof Schemas.toolSequenceWithReasoning
    >({
      model: planningModel,
      systemMessages,
      messages: [message],
      outputSchema: output,
      logPrefix: `${server.id}.createToolSequence`,
      reasoning: {
        name: server.name,
        serverId: server.id,
        withSchema: Schemas.toolSequenceWithReasoning,
      },
    });

    return toolSequenceResult.match<z.infer<typeof Schemas.toolSequence>>(
      toolSequence => {
        console.log(`${server.id}.createToolSequence.result`, { toolSequence });
        return toolSequence;
      },
      error => {
        console.error(`${server.id}.createToolSequence.error`, { error });
        // Return a default empty sequence to allow graceful degradation
        return { steps: [] };
      },
    );
  }

  // Executes a single tool step
  private async executeToolStep({
    toolStep,
    tool,
    toolId,
    safeClientServerConfig,
    agentMessage,
  }: {
    toolStep: z.infer<typeof Schemas.toolSteps>[number];
    tool: Tool;
    toolId: string;
    safeClientServerConfig: ClientServer['serverConfig'];
    agentMessage: UIMessage;
  }): Promise<Result<void, errors.ConductorError>> {
    const toolCallId = nanoid();
    const structureModel = this.provider.languageModel('structure');

    this.dataStream.write(
      formatDataStreamPart('tool_call_streaming_start', {
        toolCallId,
        toolName: toolId,
      }),
    );

    try {
      // Generate the tool input object
      const { object: toolCallObj, usage: toolCallUsage } = await generateObject({
        model: structureModel,
        system: dedent`
          A request is being made to a tool named "${tool.name}". ${
            tool.description ? `This tool is described as "${tool.description}".` : ''
          }

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
        messages: [...this.history, agentMessage, { role: 'user', content: toolStep.task }],
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

      this.writeUsageAnnotation({
        type: 'tool-usage',
        toolCallId,
        usage: toolCallUsage,
        provider: structureModel.provider,
        modelId: structureModel.modelId,
      });

      console.log(`${toolId}.executeToolStep.toolCallObj`, { toolCallObj });

      const toolInput = (toolCallObj as any).toolInput ?? {};
      const collectFromUser = (toolCallObj as any).collectFromUser ?? [];

      if (collectFromUser.length) {
        console.log('executeToolStep.collectFromUser', { collectFromUser });
        // @TODO need to break out of the loops and re-prompt the user for the missing properties
      }

      this.dataStream.write(
        formatDataStreamPart('tool_call', {
          toolCallId,
          toolName: toolId,
          args: toolInput,
        }),
      );

      const toolResult = await this.callTool({
        clientId: this.clientId,
        serverId: tool.server,
        name: toolStep.tool,
        input: toolInput,
      });

      // Parse the tool result (with fallback to empty object for safety)
      let toolResultContent;
      try {
        toolResultContent = JSON.parse(toolResult?.content?.[0]?.text ?? '{}');
      } catch (error) {
        console.error(`${toolId}.executeToolStep.parseError`, { error, content: toolResult?.content });
        return err(errors.jsonParse({ error }));
      }

      // Create a trimmed version for the LLM prompt
      const trimmedResult = createTrimmedToolResult(toolResultContent);

      // Generate JSON paths to extract relevant data
      const { object: toolOutputPaths } = await generateObject({
        model: this.provider.languageModel('structure'),
        system: dedent`
          A request was just made to a tool named "${tool.name}". ${
            tool.description ? `This tool is described as "${tool.description}".` : ''
          }

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
        messages: [...this.history, { role: 'user', content: toolStep.task }],
        schema: Schemas.toolOutputPaths,
      });

      // Process the JSON paths to extract relevant data
      const processedResultResult = processJsonPaths(
        toolResultContent,
        toolOutputPaths as z.infer<typeof Schemas.toolOutputPaths>,
      );

      if (processedResultResult.isErr()) {
        return err(processedResultResult.error);
      }

      const processedResult = processedResultResult.value;

      this.dataStream.write(
        formatDataStreamPart('tool_result', {
          toolCallId,
          result: processedResult,
        }),
      );

      agentMessage.parts.push({
        type: 'tool-invocation',
        toolInvocation: {
          toolCallId,
          state: 'result',
          toolName: toolId,
          args: toolInput ?? {},
          result: processedResult,
        },
      });

      return ok(void 0);
    } catch (error) {
      console.error(`${toolId}.executeToolStep.error`, error);
      return err(errors.other({ message: 'Error executing tool step', error }));
    }
  }

  // Executes a specific task assigned to an agent by running the necessary tool calls
  private async executeAgentTask({
    agentTask,
    clientServer,
    server,
  }: {
    agentTask: z.infer<typeof Schemas.agentPlan>['steps'][number];
    clientServer: ClientServer;
    server: Server;
  }): Promise<Result<UIMessage, errors.ConductorError>> {
    try {
      const agentTools = this.tools.filter(t => t.server === server.id);

      const safeClientServerConfig = createSafeClientServerConfig(clientServer, server);

      const toolSequence = await this.createToolSequence({
        agentTask,
        clientServerConfig: safeClientServerConfig,
        server,
        tools: agentTools,
      });

      const agentMessage: UIMessage = {
        id: nanoid(),
        role: 'assistant',
        content: '',
        parts: [],
      };

      for (const toolStep of toolSequence.steps) {
        const tool = agentTools.find(t => t.name === toolStep.tool);

        if (!tool) {
          return err(errors.toolNotFound({ toolName: toolStep.tool, serverId: server.id }));
        }

        const toolId = `${server.id}__${toolStep.tool}`;
        console.log(`${toolId}.executeAgentTask.startingStep`, { tool });

        const toolStepResult = await this.executeToolStep({
          toolStep,
          tool,
          toolId,
          safeClientServerConfig,
          agentMessage,
        });

        if (toolStepResult.isErr()) {
          return err(toolStepResult.error);
        }
      }

      return ok(agentMessage);
    } catch (error) {
      console.error(`executeAgentTask.error`, { error, agentTask, serverId: server.id });
      return err(errors.other({ message: 'Error executing agent task', error }));
    }
  }
}
