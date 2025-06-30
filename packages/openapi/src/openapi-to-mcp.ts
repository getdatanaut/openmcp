import { dereference, JSONParserErrorGroup } from '@apidevtools/json-schema-ref-parser';
import {
  type McpServerTool,
  type OpenMcpServerOptions,
  tool,
  type ToolAnnotations,
  type ToolOutput,
  type ToolParameters,
} from '@openmcp/server';
import { bundleOas2Service } from '@stoplight/http-spec/oas2';
import { bundleOas3Service } from '@stoplight/http-spec/oas3';
import { traverse } from '@stoplight/json';
import mergeAllOf from '@stoplight/json-schema-merge-allof';
import type { IHttpOperation } from '@stoplight/types';
import { jsonSchema } from 'ai';
import type { JSONSchema7 } from 'json-schema';
import unset from 'lodash-es/unset.js';

import { Client, collectOperationClientMeta } from './client.ts';

export type ServerConfig = {
  openapi: Record<string, unknown> | string;
  serverUrl?: string;
};

export type OpenAPIToolAnnotations = ToolAnnotations<{
  readOnly?: boolean;
  destructive?: boolean;
  idempotent?: boolean;
}>;

export type OpenAPITool = McpServerTool<ToolParameters, any, ToolOutput, OpenAPIToolAnnotations>;

/**
 * Allow the client to override parameters for tool calls
 */
export type ClientConfig = {
  path?: Record<string, unknown>;
  query?: Record<string, unknown>;
  headers?: Record<string, unknown>;
  body?: Record<string, unknown>;
};

export function getToolName(operation: IHttpOperation<false> | IHttpOperation<true>) {
  const endpointName = `${operation.method.toUpperCase()} ${operation.path}`;
  return cleanToolName(String(operation.iid || operation.id || endpointName));
}

function createBaseUrl(baseUrl: unknown) {
  if (typeof baseUrl !== 'string') {
    throw new TypeError(
      `No valid server URL was specified. You need to provide one using serverURL server config property or define one in OpenAPI document.`,
    );
  }

  try {
    return new URL(baseUrl);
  } catch {
    throw new Error(`Invalid server URL: ${baseUrl}`);
  }
}

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

  const defaultContentTypeHeader = 'application/json';
  const baseUrl = createBaseUrl(serverUrl || service.servers?.[0]?.url);
  const client = new Client(baseUrl, {
    requestHeaders: {
      'Content-Type': defaultContentTypeHeader,
    },
  });

  const operationTools: OpenMcpServerOptions<OpenAPITool>['tools'] = {};

  const operations = service.operations as IHttpOperation<false>[];

  for (const operation of operations) {
    const endpointName = `${operation.method.toUpperCase()} ${operation.path}`;
    const name = getToolName(operation);
    const description = [endpointName, operation.description || ''].filter(Boolean).join(' - ');
    const collectedAnnotations = collectAnnotations(operation);
    const operationClientMeta = collectOperationClientMeta(operation);

    operationTools[name] = tool({
      description,

      annotations: (await configureAnnotations?.(collectedAnnotations)) ?? collectedAnnotations,

      parameters: jsonSchema<{
        path: Record<string, unknown>;
        query: Record<string, unknown>;
        headers: Record<string, unknown>;
        body: Record<string, unknown>;
      }>(getOperationInputSchema(operation, operationClientMeta.requestContentType ?? defaultContentTypeHeader)),

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
            ...(args['headers'] || {}),
            ...(clientConfig?.headers || {}),
          },
          body: {
            ...(args['body'] || {}),
            ...(clientConfig?.body || {}),
          },
        };

        return (await client.request(operationClientMeta, params)).data;
      },
    });
  }

  const options = {
    name: service.name,
    version: service.version,
    tools: operationTools,
  } satisfies OpenMcpServerOptions<OpenAPITool>;

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

function getOperationInputSchema(operation: IHttpOperation<false>, requestContentType: string) {
  const request = operation.request || {};
  const pathParams = parametersToTool(request.path);
  const queryParams = parametersToTool(request.query);
  const headerParams = parametersToTool(request.headers);
  const bodyParam = request.body?.contents?.find(param => param.mediaType === requestContentType)?.schema;

  return constrainedObject({
    type: 'object',
    properties: removeExtraProperties({
      ...(pathParams ? { path: { type: 'object', properties: pathParams } } : {}),
      ...(queryParams ? { query: { type: 'object', properties: queryParams } } : {}),
      ...(headerParams ? { headers: { type: 'object', properties: headerParams } } : {}),
      ...(bodyParam ? { body: bodyParam } : {}),
    }),
  } satisfies JSONSchema7);
}

function constrainedObject<Value extends JSONSchema7 & { type: 'object'; properties: Record<string, JSONSchema7> }>(
  value: Value,
): Value & {
  required: (keyof Value['properties'])[];
  additionalProperties: false;
} {
  return {
    ...value,
    required: Object.keys(value.properties),
    additionalProperties: false,
  };
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
 * Remove properties that are not not needed such as x-stoplight, $schema, etc.
 */
function removeExtraProperties<T>(obj: T): T {
  traverse(obj, {
    onProperty({ parent, property }) {
      if (/^x-/.test(String(property)) || property === '$schema' || property === 'key') {
        unset(parent, property);
      }
    },
  });

  return obj;
}

function _getOperationOutputSchema(operation: IHttpOperation<false>): JSONSchema7 {
  // Try 200 first
  let response = operation.responses.find(r => r.code === '200')?.contents?.find(c => c.schema)?.schema;
  if (!response) {
    // Try 2xx
    response = operation.responses.find(r => r.code.startsWith('2'))?.contents?.find(c => c.schema)?.schema;
  }

  return response ? removeExtraProperties(response) : ({ type: 'object' } satisfies JSONSchema7);
}

function getOperationOutputSchema(operation: IHttpOperation<false>): JSONSchema7 {
  const schema = _getOperationOutputSchema(operation);
  try {
    return mergeAllOf(schema);
  } catch {
    return schema;
  }
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
