import { dereference, JSONParserErrorGroup } from '@apidevtools/json-schema-ref-parser';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { UriTemplate } from '@modelcontextprotocol/sdk/shared/uriTemplate.js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { bundleOas2Service, bundleOas3Service } from '@stoplight/http-spec';
import { traverse } from '@stoplight/json';
import type { IHttpOperation } from '@stoplight/types';
import { unset } from 'lodash';

export type ServerConfig = {
  openapi: Record<string, unknown> | string;
  serverUrl?: string;
};

/**
 * Allow the client to override parameters for tool calls
 */
export type ClientConfig = {
  path?: Record<string, unknown>;
  query?: Record<string, unknown>;
  headers?: Record<string, unknown>;
  body?: Record<string, unknown>;
};

type ToolSchema = Tool['inputSchema'];

export async function createMcpServer(
  { openapi, serverUrl }: ServerConfig,
  getClientConfig?: () => Promise<ClientConfig> | ClientConfig,
) {
  const { data: service, error } = await bundleOasService(openapi);
  if (error) {
    console.error(`Error bundling openapi ${openapi}:`, error);
    throw error;
  }

  const baseUrl = serverUrl || service.servers?.[0]?.url;

  const server = new McpServer(
    {
      name: service.name,
      version: service.version,
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  const operationTools = new Map<
    string,
    { tool: Tool & { outputSchema: ToolSchema }; operation: IHttpOperation<false> }
  >();
  const operations = service.operations as IHttpOperation<false>[];

  for (const operation of operations) {
    const endpointName = `${operation.method.toUpperCase()} ${operation.path}`;
    const name = String(operation.iid || operation.id || endpointName).slice(0, 64);
    const description = [endpointName, operation.description || ''].filter(Boolean).join(' - ');

    operationTools.set(name, {
      operation,
      tool: {
        name,
        description,
        inputSchema: getOperationInputSchema(operation),
        outputSchema: getOperationOutputSchema(operation),
      },
    });
  }

  server.server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: Array.from(operationTools.values()).map(({ tool }) => {
        return {
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
          outputSchema: tool['outputSchema'],
        };
      }),
    };
  });

  server.server.setRequestHandler(CallToolRequestSchema, async request => {
    const operationTool = operationTools.get(request.params.name);
    if (!operationTool) {
      throw new Error(`Tool ${request.params.name} not found`);
    }

    const args = request.params.arguments || {};
    const clientConfig = await getClientConfig?.();

    // TODO(CL): inject request headers based on operation's content-type
    const params = {
      path: {
        ...(args['path'] || {}),
        ...(clientConfig?.path || {}),
      },
      query: {
        ...(args['query'] || {}),
        ...(clientConfig?.query || {}),
      },
      headers: {
        'Content-Type': operationTool.operation.request?.body?.contents?.[0]?.mediaType || 'application/json',
        ...(args['headers'] || {}),
        ...(clientConfig?.headers || {}),
      },
      body: {
        ...(args['body'] || {}),
        ...(clientConfig?.body || {}),
      },
    };

    const template = new UriTemplate(operationTool.operation.path);
    const path = template.expand(params.path);
    const url = new URL(`${baseUrl?.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl}${path}`);

    // TODO(CL): could use a proper querystring library
    Object.entries(params.query).forEach(([key, value]) => {
      if (typeof value !== 'undefined') {
        url.searchParams.set(key, String(value));
      }
    });

    const requestInit = {
      url: url.toString(),
      method: operationTool.operation.method,
      headers: params.headers,
      body: params.body,
    };
    console.log(`callTool ${request.params.name}:`, requestInit);

    const res = await fetch(url.toString(), {
      method: operationTool.operation.method,
      headers: params.headers,
      body: formatBody(params.body, params.headers['Content-Type']),
    });

    let data;
    if (res.headers.get('content-type')?.includes('application/json')) {
      data = await res.json();
    } else {
      data = await res.text();
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  });

  return server;
}

async function bundleOasService(openapi: Record<string, unknown> | string) {
  const { data: result, error } = await dereferenceOpenapi(openapi);
  if (error) {
    return {
      data: null,
      error,
    };
  }

  const bundler = 'openapi' in result ? bundleOas3Service : bundleOas2Service;
  return {
    data: bundler({ document: result }),
    error: null,
  };
}

async function dereferenceOpenapi(openapi: Record<string, unknown> | string) {
  try {
    return {
      data: await dereference(openapi, { continueOnError: true, dereference: { circular: 'ignore' } }),
      error: null,
    };
  } catch (error) {
    if (error instanceof JSONParserErrorGroup) {
      // Ignore $ref errors for now
      console.log(`Error resolving openapi ${openapi}:\n${error.errors.map(e => `- ${e.message}`).join('\n')}`);
      return {
        data: error.files?.schema,
        error: error.files?.schema ? null : error,
      };
    }

    return {
      data: null,
      error: error as Error,
    };
  }
}

function getOperationInputSchema(operation: IHttpOperation<false>) {
  const request = operation.request || {};
  const pathParams = parametersToTool(request.path);
  const queryParams = parametersToTool(request.query);
  const headerParams = parametersToTool(request.headers);
  const bodyParam = request.body?.contents?.find(param => param.schema)?.schema;

  return {
    type: 'object',
    properties: removeExtraProperties({
      ...(pathParams ? { path: { type: 'object', properties: pathParams } } : {}),
      ...(queryParams ? { query: { type: 'object', properties: queryParams } } : {}),
      ...(headerParams ? { headers: { type: 'object', properties: headerParams } } : {}),
      ...(bodyParam ? { body: bodyParam } : {}),
    }),
  } as const;
}

// Turn parameters into an object with the parameter name as the key and the parameter schema as the value
function parametersToTool(params?: { name: string; description?: string; schema?: unknown }[]) {
  if (!params?.length) return;

  return params.reduce(
    (acc, param) => {
      acc[param.name] = parameterToTool(param);
      return acc;
    },
    {} as Record<string, unknown>,
  );
}

function parameterToTool(param: { name: string; description?: string; schema?: unknown }) {
  return {
    name: param.name,
    description: param.description || '',
    type: 'string',
    ...(param.schema ? param.schema : {}),
  } as const;
}

/**
 * Format body based on the content type
 */
function formatBody(body: object, contentType: string) {
  if (Object.keys(body).length) {
    if (contentType.includes('application/json')) {
      return JSON.stringify(body);
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      // URL encoded format
      const formData = new URLSearchParams();
      Object.entries(body).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
      return formData.toString();
    } else if (contentType.includes('multipart/form-data')) {
      // Multipart form data
      const formData = new FormData();
      Object.entries(body).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
      return formData;
    } else if (contentType.includes('text/plain')) {
      // Plain text
      return typeof body === 'string' ? body : String(body);
    }

    return JSON.stringify(body);
  }
}

/**
 * Remove properties that are not not needed such as x-stoplight, $schema, etc.
 */
function removeExtraProperties<T>(obj: T): T {
  traverse(obj, {
    onProperty({ parent, property }) {
      if (/^x-/.test(String(property)) || property === '$schema') {
        unset(parent, property);
      }
    },
  });

  return obj;
}

function getOperationOutputSchema(operation: IHttpOperation<false>): ToolSchema {
  // Try 200 first
  let response = operation.responses.find(r => r.code === '200')?.contents?.find(c => c.schema)?.schema;
  if (!response) {
    // Try 2xx
    response = operation.responses.find(r => r.code.startsWith('2'))?.contents?.find(c => c.schema)?.schema;
  }

  return response ? removeExtraProperties(response as ToolSchema) : { type: 'object' };
}
