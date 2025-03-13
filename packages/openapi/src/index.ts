import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { bundleOas3Service } from '@stoplight/http-spec';
import $RefParser from '@stoplight/json-schema-ref-parser/node';
import { decycle } from '@stoplight/json';

import type { IHttpOperation, IHttpOperationRequest, Reference } from '@stoplight/types';

export async function createMcpServer({
  document,
  serverUrl,
}: {
  document: Record<string, unknown>;
  serverUrl?: string;
}) {
  const result = decycle(await new $RefParser().dereference(document));

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

  const operationTools = new Map<string, { tool: Tool; operation: IHttpOperation<true> }>();

  for (const operation of service.operations) {
    const request = operation.request as IHttpOperationRequest<true>;

    const toolName = operation.iid || operation.id || `${operation.method} ${operation.path}`;
    operationTools.set(toolName, {
      operation,
      tool: {
        name: toolName,
        description: operation.description || '',
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
        ...(args['headers'] || {}),
      },
      body: {
        ...(args['body'] || {}),
      },
    };

    const url = new URL(replacePathParameters(operationTool.operation.path, params.path), baseUrl);

    Object.entries(params.query).forEach(([key, value]) => {
      if (typeof value !== 'undefined') {
        url.searchParams.set(key, String(value));
      }
    });

    // TODO(CL): Correctly format body based on operation's content-type
    let body;
    if (Object.keys(params['body']).length) {
      body = JSON.stringify(params['body']);
    }

    const res = await fetch(url, {
      method: operationTool.operation.method,
      headers: params.headers,
      body,
    });

    const data = await res.json();

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

function requestParametersToTool({ path, query, headers, body }: IHttpOperationRequest<true>) {
  const pathParams = path?.flatMap(param => (isReference(param) ? [] : parameterToTool(param)));
  const queryParams = query?.flatMap(param => (isReference(param) ? [] : parameterToTool(param)));
  const headerParams = headers?.flatMap(param => (isReference(param) ? [] : parameterToTool(param)));

  const bodyParam = body && isReference(body) ? undefined : body?.contents?.find(param => param.schema)?.schema;

  return {
    type: 'object',
    properties: {
      ...(pathParams ? { path: pathParams } : {}),
      ...(queryParams ? { query: queryParams } : {}),
      ...(headerParams ? { headers: headerParams } : {}),
      ...(bodyParam ? { body: bodyParam } : {}),
    },
  } as const;
}

function parameterToTool(param: { name: string; description?: string; schema?: unknown }) {
  return {
    name: param.name,
    description: param.description || '',
    type: 'string',
    ...(param.schema ? param.schema : {}),
  };
}

function replacePathParameters(path: string, params: Record<string, unknown>): string {
  return path.replace(/\{([^}]+)\}/g, (match, paramName) => {
    const value = params[paramName];
    if (value === undefined) {
      throw new Error(`Missing required path parameter: ${paramName}`);
    }
    return encodeURIComponent(String(value));
  });
}
