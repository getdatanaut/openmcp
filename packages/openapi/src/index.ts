import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { UriTemplate } from '@modelcontextprotocol/sdk/shared/uriTemplate.js';
import { bundleOas3Service, bundleOas2Service } from '@stoplight/http-spec';
import $RefParser from '@stoplight/json-schema-ref-parser/node';
import { traverse } from '@stoplight/json';
import { unset } from 'lodash';

import type { IHttpOperation, IHttpOperationRequest } from '@stoplight/types';
import { inspect } from 'node:util';

/**
 * Allow the client to override parameters for tool calls
 */
export type ClientConfig = {
  path?: Record<string, unknown>;
  query?: Record<string, unknown>;
  headers?: Record<string, unknown>;
  body?: Record<string, unknown>;
};

export async function createMcpServer(
  {
    openapi,
    serverUrl,
    debug = false,
  }: {
    openapi: Record<string, unknown> | string;
    serverUrl?: string;
    debug?: boolean;
  },
  getClientConfig?: () => Promise<ClientConfig> | ClientConfig,
) {
  const service = await bundleOasService(openapi);

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

  const operationTools = new Map<string, { tool: Tool; operation: IHttpOperation<false> }>();

  for (const operation of service.operations) {
    const request = operation.request as IHttpOperationRequest<false>;

    const toolName = operation.iid || operation.id || `${operation.method.toUpperCase()} ${operation.path}`;
    const description = [`${operation.method.toUpperCase()} ${operation.path}`, `${operation.description || ''}`]
      .filter(Boolean)
      .join(' - ');

    operationTools.set(toolName, {
      operation: operation as IHttpOperation<false>,
      tool: {
        name: toolName,
        description,
        inputSchema: requestParametersToTool(request),
      },
    });
  }

  server.server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: Array.from(operationTools.values()).map(({ tool }) => tool),
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

    if (debug) {
      console.log(
        'openapi.callTool',
        request.params.name,
        inspect(
          {
            url: url.toString(),
            method: operationTool.operation.method,
            headers: params.headers,
            body: formatBody(params.body, params.headers['Content-Type']),
          },
          {
            depth: 10,
            colors: true,
          },
        ),
      );
    }

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
  const result = await new $RefParser().dereference(openapi);

  if ('openapi' in result) {
    return bundleOas3Service({ document: result });
  } else {
    return bundleOas2Service({ document: result });
  }
}

function requestParametersToTool({ path, query, headers, body }: IHttpOperationRequest<false>) {
  const pathParams = parametersToTool(path);
  const queryParams = parametersToTool(query);
  const headerParams = parametersToTool(headers);
  const bodyParam = body?.contents?.find(param => param.schema)?.schema;

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
