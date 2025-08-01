import { asSchema } from '@ai-sdk/provider-utils';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import type {
  CallToolResultSchema,
  ClientCapabilities,
  Implementation,
  ListResourcesResult,
  ListResourceTemplatesResult,
} from '@modelcontextprotocol/sdk/types.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
  ToolSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { addToolRequirementsToSchema, autoTrimToolResult } from '@openmcp/utils';
import type { LanguageModel } from 'ai';
import type { JSONSchema7 } from 'json-schema';
import type { z } from 'zod';

import {
  jsonResource,
  jsonResourceTemplate,
  type Resource,
  resource,
  type ResourceTemplate,
  resourceTemplate,
  type ResourceUri,
} from './resources.ts';
import type {
  inferToolParameters,
  McpServerTool,
  ToolAnnotations,
  ToolName,
  ToolOutput,
  ToolParameters,
} from './tools.ts';

interface RegisteredTool<Annotations extends ToolAnnotations = ToolAnnotations> {
  name: string;
  description?: string;
  inputSchema?: JSONSchema7;
  outputSchema?: JSONSchema7;
  execute: (args: z.infer<z.ZodTypeAny>) => Promise<unknown>;
  annotations?: Annotations;
}

export interface TransformToolResultOpts {
  tool: Omit<RegisteredTool, 'execute'>;
  toolArgs?: unknown;
  toolResult?: unknown;
}

export interface OpenMcpServerOptions<Tool extends McpServerTool = McpServerTool> {
  name: string;
  version: string;
  instructions?: string;
  tools?: Record<ToolName, Tool>;
  resources?: (Resource<string, unknown> | ResourceTemplate<string, unknown>)[];
  onInitialize?: (clientInfo: Implementation, clientCapabilities: ClientCapabilities) => void;
  transformToolResult?: (opts: TransformToolResultOpts) => any;
  structuredOutputs?: boolean;
  autoTrimToolResult?: {
    enabled: boolean;
    model: LanguageModel & { provider: string };

    // Tool results with fewer than this many tokens will not be trimmed
    minTokens?: number;
  };
}

const AUTO_TRIM_MIN_TOKENS_DEFAULT = 5000;

/**
 * An MPC server implementation that:
 *
 * - accepts zod or json schema for tool descriptions
 * - accepts and returns output schemas for tools
 * - exposes the callback methods (list tools, list resources, etc) for consumers to override/extend as needed
 * - adds a hook to transform tool results
 * - adds optional auto-trimming of tool results
 */
export class OpenMcpServer {
  readonly server: Server;

  #tools: Record<ToolName, RegisteredTool> = {};
  #resources: Record<ResourceUri, Resource> = {};
  #resourceTemplates: Record<ResourceUri, ResourceTemplate> = {};
  #transformToolResult: OpenMcpServerOptions['transformToolResult'];
  #structuredOutputs: OpenMcpServerOptions['structuredOutputs'];
  #autoTrimToolResult: OpenMcpServerOptions['autoTrimToolResult'];

  constructor(options: OpenMcpServerOptions) {
    this.#transformToolResult = options.transformToolResult;
    this.#autoTrimToolResult = options.autoTrimToolResult;
    this.#structuredOutputs = options.structuredOutputs;

    this.server = new Server({ name: options.name, version: options.version }, { instructions: options.instructions });

    this.server.oninitialized = () => {
      const clientInfo = this.server.getClientVersion();
      const clientCapabilities = this.server.getClientCapabilities();

      if (!clientInfo) {
        throw new Error('client info not available after initialization');
      }

      if (!clientCapabilities) {
        throw new Error('client capabilities not available after initialization');
      }

      options.onInitialize?.(clientInfo, clientCapabilities);
    };

    if (options.tools) {
      for (const [name, tool] of Object.entries(options.tools)) {
        this.tool({ name, ...tool });
      }
    }

    if (options.resources) {
      for (const resource of options.resources) {
        if ('uri' in resource) {
          this.resource(resource.uri, resource);
        } else {
          this.resourceTemplate(resource.uriTemplate.toString(), resource);
        }
      }
    }
  }

  connect(transport: Transport) {
    return this.server.connect(transport);
  }

  close() {
    return this.server.close();
  }

  /**
   * Tools
   */

  tool<
    Params extends ToolParameters,
    ToolResult,
    OutputSchema extends ToolOutput,
    Annotations extends ToolAnnotations,
  >({
    name,
    description,
    parameters,
    output,
    execute,
    annotations,
  }: {
    name: string;
    description?: string;
    parameters?: Params;
    output?: OutputSchema;
    execute: (args: inferToolParameters<Params>) => Promise<ToolResult>;
    annotations?: Annotations;
  }) {
    const inputSchema = parameters ? asSchema(parameters).jsonSchema : undefined;
    let outputSchema: JSONSchema7 | undefined;
    if (this.#structuredOutputs) {
      const maybeOutputSchema = asSchema(output).jsonSchema;
      const outputSchemaParseResult = ToolSchema.shape.outputSchema.safeParse(maybeOutputSchema);
      if (outputSchemaParseResult.success) {
        outputSchema = maybeOutputSchema;
      } else {
        console.warn(
          `[tool] output schema for tool ${JSON.stringify(name)} is invalid: ${outputSchemaParseResult.error}`,
        );
      }
    }

    this.#tools[name] = {
      name,
      description,
      inputSchema: this.#autoTrimToolResult ? addToolRequirementsToSchema(inputSchema) : inputSchema,
      outputSchema,
      execute,
      annotations: {
        title: annotations?.title,
        ...toAnnotationHints(annotations?.hints),
      },
    };

    this.setToolRequestHandlers();
  }

  protected async getTools(): Promise<Record<ToolName, RegisteredTool>> {
    return this.#tools;
  }

  async listTools() {
    return {
      tools: Object.values(await this.getTools()),
    };
  }

  async callTool(request: z.infer<typeof CallToolRequestSchema>): Promise<z.infer<typeof CallToolResultSchema>> {
    const toolName = request.params.name as ToolName;

    const tool = (await this.getTools())[toolName];
    if (!tool) {
      throw new McpError(ErrorCode.InvalidParams, `Tool ${request.params.name} not found`);
    }

    const args = request.params.arguments;
    // @TODO: we could validate the args w the json schema, if we want to bring in a lightweight schema validator
    if (tool.inputSchema && !args) {
      throw new McpError(ErrorCode.InvalidParams, `Invalid arguments for tool ${request.params.name}`);
    }

    try {
      let result = await tool.execute(args);

      if (this.#transformToolResult) {
        result = this.#transformToolResult({
          tool,
          toolArgs: args,
          toolResult: result,
        });
      }

      const toolResultRequirements = args?.['__tool_result_requirements'] as string | undefined;
      if (result && this.#autoTrimToolResult?.enabled && toolResultRequirements) {
        const trimmedResult = await autoTrimToolResult({
          tool: { name: toolName, description: tool.description },
          toolResult: result,
          toolResultRequirements,
          model: this.#autoTrimToolResult.model,
          minTokens: this.#autoTrimToolResult.minTokens ?? AUTO_TRIM_MIN_TOKENS_DEFAULT,
        });

        if (trimmedResult.isErr()) {
          throw trimmedResult.error;
        }

        result = trimmedResult.value;
      }

      return {
        content: result ? [{ type: 'text', text: JSON.stringify(result) }] : [],
        ...(tool.outputSchema
          ? {
              structuredContent: Object(result),
            }
          : null),
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
  }

  #toolHandlersInitialized = false;
  protected setToolRequestHandlers() {
    if (this.#toolHandlersInitialized) {
      return;
    }

    this.server.registerCapabilities({ tools: {} });

    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return this.listTools();
    });

    this.server.setRequestHandler(CallToolRequestSchema, request => {
      return this.callTool(request);
    });

    this.#toolHandlersInitialized = true;
  }

  /**
   * Resources
   */

  resource<Uri extends ResourceUri, Result>(uri: Uri, r: Omit<Resource<Uri, Result>, 'uri'>) {
    this.#resources[uri] = resource(uri, r);
    this.setResourceRequestHandlers();
  }

  resourceTemplate<Uri extends ResourceUri, Result>(
    uriTemplate: Uri,
    r: Omit<ResourceTemplate<Uri, Result>, 'uriTemplate'>,
  ) {
    this.#resourceTemplates[uriTemplate] = resourceTemplate(uriTemplate, r);
    this.setResourceRequestHandlers();
  }

  jsonResource<Uri extends ResourceUri, Result>(uri: Uri, r: Omit<Resource<Uri, Result>, 'uri' | 'mimeType'>) {
    this.#resources[uri] = jsonResource(uri, r);
    this.setResourceRequestHandlers();
  }

  jsonResourceTemplate<Uri extends ResourceUri, Result>(
    uriTemplate: Uri,
    r: Omit<ResourceTemplate<Uri, Result>, 'uriTemplate' | 'mimeType'>,
  ) {
    this.#resourceTemplates[uriTemplate] = jsonResourceTemplate(uriTemplate, r);
    this.setResourceRequestHandlers();
  }

  async listResources(): Promise<ListResourcesResult> {
    return {
      resources: Object.values(this.#resources).map(r => ({
        name: r.name,
        uri: r.uri,
        description: r.description,
        mimeType: r.mimeType,
      })),
    };
  }

  async listResourceTemplates(): Promise<ListResourceTemplatesResult> {
    return {
      resourceTemplates: Object.values(this.#resourceTemplates).map(r => ({
        name: r.name,
        uriTemplate: r.uriTemplate.toString(),
        description: r.description,
        mimeType: r.mimeType,
      })),
    };
  }

  async readResource(request: z.infer<typeof ReadResourceRequestSchema>) {
    const uri = new URL(request.params.uri).toString();

    let result;

    const resource = this.#resources[uri];
    if (resource) {
      result = await resource.read(uri);
    } else {
      for (const template of Object.values(this.#resourceTemplates)) {
        const variables = template.uriTemplate.match(uri);
        if (variables) {
          result = await template.read(uri, variables);
          break;
        }
      }
    }

    if (!result) {
      throw new McpError(ErrorCode.InvalidParams, `Resource ${uri} not found`);
    }

    const contents = Array.isArray(result) ? result : [result];

    return { contents };
  }

  #resourceHandlersInitialized = false;
  protected setResourceRequestHandlers() {
    if (this.#resourceHandlersInitialized) {
      return;
    }

    this.server.registerCapabilities({ resources: {} });

    this.server.setRequestHandler(ListResourcesRequestSchema, () => {
      return this.listResources();
    });

    this.server.setRequestHandler(ListResourceTemplatesRequestSchema, () => {
      return this.listResourceTemplates();
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, request => {
      return this.readResource(request);
    });

    this.#resourceHandlersInitialized = true;
  }
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

function toAnnotationHints(hints: ToolAnnotations['hints'] | undefined) {
  if (!hints) {
    return;
  }

  const transformedHints: Record<string, boolean> = {};
  for (const [key, value] of Object.entries(hints)) {
    transformedHints[`${key}Hint`] = value;
  }

  return transformedHints;
}
