import { asSchema } from '@ai-sdk/ui-utils';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import {
  CallToolRequestSchema,
  type ClientCapabilities,
  ErrorCode,
  type Implementation,
  ListResourcesRequestSchema,
  type ListResourcesResult,
  ListResourceTemplatesRequestSchema,
  type ListResourceTemplatesResult,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { addToolRequirementsToSchema, autoTrimToolResult } from '@openmcp/utils';
import type { LanguageModelV1 } from 'ai';
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
import type { inferToolParameters, MpcServerTool, ToolName, ToolOutput, ToolParameters } from './tools.ts';

interface RegisteredTool {
  name: string;
  description?: string;
  inputSchema?: JSONSchema7;
  outputSchema?: JSONSchema7;
  execute: (args: z.infer<z.ZodTypeAny>) => Promise<unknown>;
}

export interface TransformToolResultOpts {
  tool: Omit<RegisteredTool, 'execute'>;
  toolArgs?: unknown;
  toolResult?: unknown;
}

export interface OpenMcpServerOptions {
  name: string;
  version: string;
  instructions?: string;
  tools?: Record<ToolName, MpcServerTool>;
  resources?: (Resource<string, unknown> | ResourceTemplate<string, unknown>)[];
  onInitialize?: (clientInfo: Implementation, clientCapabilities: ClientCapabilities) => void;
  transformToolResult?: (opts: TransformToolResultOpts) => any;
  autoTrimToolResult?: {
    enabled: boolean;
    model: LanguageModelV1;

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
export class OpenMpcServer {
  readonly server: Server;

  #tools: Record<ToolName, RegisteredTool> = {};
  #resources: Record<ResourceUri, Resource> = {};
  #resourceTemplates: Record<ResourceUri, ResourceTemplate> = {};
  #transformToolResult: OpenMcpServerOptions['transformToolResult'];
  #autoTrimToolResult: OpenMcpServerOptions['autoTrimToolResult'];

  constructor(options: OpenMcpServerOptions) {
    this.#transformToolResult = options.transformToolResult;
    this.#autoTrimToolResult = options.autoTrimToolResult;

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

  tool<Params extends ToolParameters, ToolResult, OutputSchema extends ToolOutput>({
    name,
    description,
    parameters,
    output,
    execute,
  }: {
    name: string;
    description?: string;
    parameters?: Params;
    output?: OutputSchema;
    execute: (args: inferToolParameters<Params>) => Promise<ToolResult>;
  }) {
    const inputSchema = parameters ? asSchema(parameters).jsonSchema : undefined;

    this.#tools[name] = {
      name,
      description,
      inputSchema: this.#autoTrimToolResult ? addToolRequirementsToSchema(inputSchema) : inputSchema,
      outputSchema: output ? asSchema(output).jsonSchema : undefined,
      execute,
    };

    this.#setToolRequestHandlers();
  }

  async listTools() {
    return {
      tools: Object.entries(this.#tools),
    };
  }

  async callTool(request: z.infer<typeof CallToolRequestSchema>) {
    const toolName = request.params.name as ToolName;

    const tool = this.#tools[toolName];
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
  #setToolRequestHandlers() {
    if (this.#toolHandlersInitialized) {
      return;
    }

    this.server.registerCapabilities({ tools: {} });

    this.server.setRequestHandler(ListToolsRequestSchema, () => {
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
    this.#setResourceRequestHandlers();
  }

  resourceTemplate<Uri extends ResourceUri, Result>(
    uriTemplate: Uri,
    r: Omit<ResourceTemplate<Uri, Result>, 'uriTemplate'>,
  ) {
    this.#resourceTemplates[uriTemplate] = resourceTemplate(uriTemplate, r);
    this.#setResourceRequestHandlers();
  }

  jsonResource<Uri extends ResourceUri, Result>(uri: Uri, r: Omit<Resource<Uri, Result>, 'uri' | 'mimeType'>) {
    this.#resources[uri] = jsonResource(uri, r);
    this.#setResourceRequestHandlers();
  }

  jsonResourceTemplate<Uri extends ResourceUri, Result>(
    uriTemplate: Uri,
    r: Omit<ResourceTemplate<Uri, Result>, 'uriTemplate' | 'mimeType'>,
  ) {
    this.#resourceTemplates[uriTemplate] = jsonResourceTemplate(uriTemplate, r);
    this.#setResourceRequestHandlers();
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
  #setResourceRequestHandlers() {
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
