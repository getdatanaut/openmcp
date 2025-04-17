import type { OpenAPITransport, SSETransport, StdIOTransport, StreamableHTTPTransport } from '@libs/schemas/mcp';
import type { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import type { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import type { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

import type { OpenAPIClientTransport } from './openapi.ts';

type Clients = {
  openapi: OpenAPIClientTransport;
  sse: SSEClientTransport;
  streamableHttp: StreamableHTTPClientTransport;
  stdio: StdioClientTransport;
};

export type TransportDefinition<T extends TransportType> = {
  readonly transport: Clients[T];
  readonly transportConfig: TransportConfig<T>;
  readonly configSchema:
    | {
        type: 'object';
        properties: {
          [key: string]: {
            type: 'string' | 'boolean' | 'number';
          };
        };
        required: string[];
      }
    | undefined;
  readonly externalId: string | undefined;
  // some of that won't be needed once we MCP supports more robust server annotations
  readonly metadata?: {
    readonly name?: string;
    readonly summary?: string;
    readonly description?: string;
    readonly developer?: string;
    readonly developerUrl?: string;
    readonly iconUrl?: string;
  };
};

export type TransportConfigs = {
  openapi: OpenAPITransport;
  sse: SSETransport;
  streamableHttp: StreamableHTTPTransport;
  stdio: StdIOTransport;
};

export type TransportType = keyof TransportConfigs;

export type TransportConfig<T extends TransportType> = TransportConfigs[T];
