import { asSchema } from '@ai-sdk/ui-utils';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  CallToolRequestSchema,
  type ClientCapabilities,
  type Implementation,
  ListToolsRequestSchema,
  type ServerCapabilities,
} from '@modelcontextprotocol/sdk/types.js';
import { addToolRequirementsToSchema, autoTrimToolResult } from '@openmcp/utils';
import type { LanguageModelV1, Schema } from 'ai';
import type { z } from 'zod';

// aisdk does not export these, so copied over
type ToolParameters = z.ZodTypeAny | Schema<any>;
type inferParameters<Params extends ToolParameters> =
  Params extends Schema<any> ? Params['_type'] : Params extends z.ZodTypeAny ? z.infer<Params> : never;

type ToolOutput = z.ZodTypeAny | Schema<any>;

export interface MpcServerTool<
  Params extends ToolParameters = any,
  ToolResult = any,
  OutputSchema extends ToolOutput = any,
> {
  parameters: Params;
  description?: string;
  output?: OutputSchema;
  execute: (args: inferParameters<Params>) => Promise<ToolResult>;
}

export function tool<Params extends ToolParameters, ToolResult, OutputSchema extends ToolOutput>(
  tool: MpcServerTool<Params, ToolResult, OutputSchema>,
) {
  return tool;
}

export interface TransformToolResultOpts {
  tool: Omit<MpcServerTool, 'execute'> & { name: string };
  toolArgs: unknown;
  toolResult?: Record<string, unknown>;
}

export type McpServerOptions = {
  name: string;
  version: string;
  tools?: Record<string, MpcServerTool>;
  onInitialize?: (clientInfo: Implementation, clientCapabilities: ClientCapabilities) => void;
  transformToolResult?: (opts: TransformToolResultOpts) => Record<string, unknown> | undefined;
  autoTrimToolResult?: {
    enabled: boolean;
    model: LanguageModelV1;

    // Tool results with fewer than this many tokens will not be trimmed
    minTokens?: number;
  };
};

const AUTO_TRIM_MIN_TOKENS_DEFAULT = 5000;

export function createMcpServer(options: McpServerOptions) {
  const capabilities: ServerCapabilities = {};

  if (options.tools) {
    capabilities.tools = {};
  }

  const mpc = new McpServer(
    {
      name: options.name,
      version: options.version,
    },
    {
      capabilities,
    },
  );

  mpc.server.oninitialized = () => {
    const clientInfo = mpc.server.getClientVersion();
    const clientCapabilities = mpc.server.getClientCapabilities();

    if (!clientInfo) {
      throw new Error('client info not available after initialization');
    }

    if (!clientCapabilities) {
      throw new Error('client capabilities not available after initialization');
    }

    options.onInitialize?.(clientInfo, clientCapabilities);
  };

  if (options.tools) {
    const tools = options.tools;
    const toolList = Object.entries(tools).map(([name, { description, parameters, output }]) => {
      const inputSchema = asSchema(parameters).jsonSchema;
      return {
        name,
        description,
        inputSchema: options.autoTrimToolResult ? addToolRequirementsToSchema(inputSchema) : inputSchema,
        outputSchema: output ? asSchema(output).jsonSchema : undefined,
      };
    });

    type Tools = typeof tools;
    type ToolName = keyof Tools;
    type Tool = Tools[ToolName];

    mpc.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: toolList,
      };
    });

    mpc.server.setRequestHandler(CallToolRequestSchema, async request => {
      const toolName = request.params.name as ToolName;

      if (!(toolName in tools)) {
        throw new Error('tool not found');
      }

      const tool = tools[toolName];

      if (!tool) {
        throw new Error('tool not found');
      }

      const args = request.params.arguments as z.infer<Tool['parameters']>;

      if (!args) {
        throw new Error('missing arguments');
      }

      try {
        let result: Record<string, unknown> | undefined = await tool.execute(args);

        if (options.transformToolResult) {
          result = options.transformToolResult({
            tool: { name: toolName, ...tool },
            toolArgs: args,
            toolResult: result,
          });
        }

        const toolResultRequirements = args['__tool_result_requirements'] as string | undefined;
        if (result && options.autoTrimToolResult?.enabled && toolResultRequirements) {
          const trimmedResult = await autoTrimToolResult({
            tool: { name: toolName, description: tool.description },
            toolResult: result,
            toolResultRequirements,
            model: options.autoTrimToolResult.model,
            minTokens: options.autoTrimToolResult.minTokens ?? AUTO_TRIM_MIN_TOKENS_DEFAULT,
          });

          if (trimmedResult.isErr()) {
            throw trimmedResult.error;
          }

          result = trimmedResult.value;
        }

        return {
          content: result ? [{ type: 'text', text: JSON.stringify(result) }] : [],
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: enumerateError(error) }),
            },
          ],
        };
      }
    });
  }

  return mpc;
}

function enumerateError(error: unknown) {
  if (!error) {
    return error;
  }

  if (typeof error !== 'object') {
    return error;
  }

  const newError: Record<string, unknown> = {};

  const errorProps = ['name', 'message'] as const;

  for (const prop of errorProps) {
    if (prop in error) {
      newError[prop] = (error as Record<string, unknown>)[prop];
    }
  }

  return newError;
}
