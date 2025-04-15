import { dereference, JSONParserErrorGroup } from '@apidevtools/json-schema-ref-parser';
import { UriTemplate } from '@modelcontextprotocol/sdk/shared/uriTemplate.js';
import { type OpenMcpServerOptions, tool, type ToolAnnotations } from '@openmcp/server';
import { bundleOas2Service, bundleOas3Service } from '@stoplight/http-spec';
import { traverse } from '@stoplight/json';
import type { IHttpOperation } from '@stoplight/types';
import { jsonSchema } from 'ai';
import type { JSONSchema7 } from 'json-schema';
import unset from 'lodash/unset.js';

export type ServerConfig = {
  openapi: Record<string, unknown> | string;
  serverUrl?: string;
};

export type OpenAPIToolAnnotations = ToolAnnotations<{
  readOnly?: boolean;
  destructive?: boolean;
  idempotent?: boolean;
}>;

/**
 * Allow the client to override parameters for tool calls
 */
export type ClientConfig = {
  path?: Record<string, unknown>;
  query?: Record<string, unknown>;
  headers?: Record<string, unknown>;
  body?: Record<string, unknown>;
};

export async function openApiToMcpServerOptions(
  { openapi, serverUrl }: ServerConfig,
  {
    getClientConfig,
    configureAnnotations,
  }: {
    getClientConfig?(): Promise<ClientConfig> | ClientConfig;
    configureAnnotations?(
      annotations: OpenAPIToolAnnotations,
    ): Promise<OpenAPIToolAnnotations> | OpenAPIToolAnnotations;
  } = {},
) {
  const { data: service, error } = await bundleOasService(openapi);
  if (error) {
    console.error(`Error bundling openapi ${openapi}:`, error);
    throw error;
  }

  const baseUrl = serverUrl || service.servers?.[0]?.url;

  const operationTools: OpenMcpServerOptions['tools'] = {};

  const operations = service.operations as IHttpOperation<false>[];

  for (const operation of operations) {
    const endpointName = `${operation.method.toUpperCase()} ${operation.path}`;
    const name = cleanToolName(String(operation.iid || operation.id || endpointName));
    const description = [endpointName, operation.description || ''].filter(Boolean).join(' - ');
    const collectedAnnotations = collectAnnotations(operation);

    operationTools[name] = tool({
      description,

      annotations: (await configureAnnotations?.(collectedAnnotations)) ?? collectedAnnotations,

      parameters: jsonSchema<{
        path: Record<string, unknown>;
        query: Record<string, unknown>;
        headers: Record<string, unknown>;
        body: Record<string, unknown>;
      }>(getOperationInputSchema(operation)),

      output: jsonSchema(getOperationOutputSchema(operation)),

      execute: async args => {
        const clientConfig = await getClientConfig?.();

        // @TODO(CL): inject request headers based on operation's content-type
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
            'Content-Type': operation.request?.body?.contents?.[0]?.mediaType || 'application/json',
            ...(args['headers'] || {}),
            ...(clientConfig?.headers || {}),
          },
          body: {
            ...(args['body'] || {}),
            ...(clientConfig?.body || {}),
          },
        };

        const template = new UriTemplate(operation.path);

        // Convert all values in params.path to strings to satisfy the Variables type
        const stringifiedPathParams: Record<string, string | string[]> = {};
        Object.entries(params.path).forEach(([key, value]) => {
          stringifiedPathParams[key] = String(value);
        });
        const path = template.expand(stringifiedPathParams);

        const url = new URL(`${baseUrl?.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl}${path}`);

        // @TODO(CL): could use a proper querystring library
        Object.entries(params.query).forEach(([key, value]) => {
          if (typeof value !== 'undefined') {
            url.searchParams.set(key, String(value));
          }
        });

        const res = await fetch(url.toString(), {
          method: operation.method,
          headers: params.headers,
          body: formatBody(params.body, params.headers['Content-Type']),
        });

        if (res.headers.get('content-type')?.includes('application/json')) {
          return res.json();
        } else {
          // @TODO hmm... how should a text response be handled?
          return res.text();
        }
      },
    });
  }

  const options = {
    name: service.name,
    version: service.version,
    tools: operationTools,
  } satisfies OpenMcpServerOptions;

  return { service, options };
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
  } satisfies JSONSchema7;
}

// Turn parameters into an object with the parameter name as the key and the parameter schema as the value
function parametersToTool(params?: { name: string; description?: string; schema?: unknown }[]) {
  if (!params?.length) return;

  return params.reduce(
    (acc, param) => {
      acc[param.name] = parameterToTool(param);
      return acc;
    },
    {} as Record<string, JSONSchema7>,
  );
}

function parameterToTool(param: { name: string; description?: string; schema?: unknown }) {
  return {
    title: param.name,
    description: param.description || '',
    type: 'string',
    ...(param.schema ? param.schema : {}),
  } satisfies JSONSchema7;
}

/**
 * Tool names must match '^[a-zA-Z0-9_-]+$'.
 * They can be maximum 64 characters long.
 */
function cleanToolName(name: string) {
  return name.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
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

function getOperationOutputSchema(operation: IHttpOperation<false>): JSONSchema7 {
  // Try 200 first
  let response = operation.responses.find(r => r.code === '200')?.contents?.find(c => c.schema)?.schema;
  if (!response) {
    // Try 2xx
    response = operation.responses.find(r => r.code.startsWith('2'))?.contents?.find(c => c.schema)?.schema;
  }

  return response ? removeExtraProperties(response) : ({ type: 'object' } satisfies JSONSchema7);
}

// https://datatracker.ietf.org/doc/html/rfc9110#section-9.2.1
const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS', 'TRACE'] as const;

// https://datatracker.ietf.org/doc/html/rfc9110#section-9.2.2
const IDEMPOTENT_METHODS = ['PUT', 'DELETE', ...SAFE_METHODS] as const;

const DESTRUCTIVE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'] as const;

function collectAnnotations(operation: IHttpOperation): OpenAPIToolAnnotations {
  const method = operation.method.toUpperCase();
  return {
    title: operation.summary,
    hints: {
      readOnly: (SAFE_METHODS as readonly string[]).includes(method),
      destructive: (DESTRUCTIVE_METHODS as readonly string[]).includes(method),
      idempotent: (IDEMPOTENT_METHODS as readonly string[]).includes(method),
    },
  };
}
