import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { UriTemplate } from '@modelcontextprotocol/sdk/shared/uriTemplate.js';
import { bundleOas3Service } from '@stoplight/http-spec';
import $RefParser from '@stoplight/json-schema-ref-parser/node';
import { decycle } from '@stoplight/json';

import type { IHttpOperation, IHttpOperationRequest, Reference } from '@stoplight/types';

export async function createMcpServer({
  openapi,
  serverUrl,
}: {
  openapi: Record<string, unknown> | string;
  serverUrl?: string;
}) {
  const result = decycle(await new $RefParser().dereference(openapi));

  const service = bundleOas3Service({ document: result });

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

    // TODO(CL): inject request headers based on operation's content-type
    const params = {
      path: {
        ...(args['path'] || {}),
      },
      query: {
        ...(args['query'] || {}),
      },
      headers: {
        'Content-Type': operationTool.operation.request?.body?.contents?.[0]?.mediaType || 'application/json',
        ...(args['headers'] || {}),
      },
      body: {
        ...(args['body'] || {}),
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

function isReference(value: any): value is Reference {
  return '$ref' in value;
}

function requestParametersToTool({ path, query, headers, body }: IHttpOperationRequest<false>) {
  const pathParams = parametersToTool(path);
  const queryParams = parametersToTool(query);
  const headerParams = parametersToTool(headers);

  const bodyParam = body && isReference(body) ? undefined : body?.contents?.find(param => param.schema)?.schema;

  return {
    type: 'object',
    properties: {
      ...(pathParams ? { path: { type: 'object', properties: pathParams } } : {}),
      ...(queryParams ? { query: { type: 'object', properties: queryParams } } : {}),
      ...(headerParams ? { headers: { type: 'object', properties: headerParams } } : {}),
      ...(bodyParam ? { body: bodyParam } : {}),
    },
  } as const;
}

// Turn parameters into an object with the parameter name as the key and the parameter schema as the value
function parametersToTool(params?: { name: string; description?: string; schema?: unknown }[]) {
  return params?.reduce(
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
