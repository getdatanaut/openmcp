import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import type { StdioServerParameters } from '@modelcontextprotocol/sdk/client/stdio.js';
import { WebSocketClientTransport } from '@modelcontextprotocol/sdk/client/websocket.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import type { EventSourceInit } from 'eventsource';

export type TransportType = keyof TransportConfigs;

export interface TransportConfigs {
  stdio: StdioTransportConfig;
  sse: SseTransportConfig;
  websocket: WebSocketTransportConfig;
  streamableHttp: StreamableHTTPTransportConfig;
  inMemory: InMemoryTransportConfig;
}

// @TODO we can prob simplify this to just be Record<TransportType, TransportConfigs[TransportType]>
export type TransportConfig<T extends TransportType = TransportType> = {
  type: T;
  config: TransportConfigs[T];
};

export type StdioTransportConfig = StdioServerParameters;

export type SseTransportConfig = {
  url: string;
  eventSourceInit?: EventSourceInit;
  requestInit?: RequestInit;
};

export type StreamableHTTPTransportConfig = {
  url: string;
  requestInit?: RequestInit;
};

export type WebSocketTransportConfig = {
  url: string;
};

export type InMemoryTransportConfig = {};

/**
 * Create instance of a transport for a given type and config.
 */
export async function createTransport<T extends TransportType>(type: T, config: TransportConfigs[T]) {
  if (import.meta.env?.PLATFORM !== 'browser' && isStdioTransportConfig(type, config)) {
    const { StdioClientTransport } = await import('@modelcontextprotocol/sdk/client/stdio.js');
    const transport = new StdioClientTransport({
      command: config.command,
      args: config.args,
      env: config.env,
      cwd: config.cwd,
      stderr: config.stderr,
    });

    return {
      clientTransport: transport,
      serverTransport: transport,
    };
  }

  if (isStreamableHTTPTransportConfig(type, config)) {
    const { StreamableHTTPClientTransport } = await import('@modelcontextprotocol/sdk/client/streamableHttp.js');
    const transport = new StreamableHTTPClientTransport(new URL(config.url), {
      requestInit: config.requestInit,
    });

    return {
      clientTransport: transport,
      serverTransport: transport,
    };
  }

  if (isSseTransportConfig(type, config)) {
    const transport = new SSEClientTransport(new URL(config.url), {
      eventSourceInit: config.eventSourceInit,
      requestInit: config.requestInit,
    });

    return {
      clientTransport: transport,
      serverTransport: transport,
    };
  }

  if (isWebSocketTransportConfig(type, config)) {
    const transport = new WebSocketClientTransport(new URL(config.url));
    return {
      clientTransport: transport,
      serverTransport: transport,
    };
  }

  if (isInMemoryTransportConfig(type, config)) {
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    return {
      clientTransport,
      serverTransport,
    };
  }

  throw new Error(`Transport "${type}" is not supported`);
}

export function isStdioTransportConfig(type: string, config: unknown): config is StdioTransportConfig {
  return type === 'stdio';
}

export function isSseTransportConfig(type: string, config: unknown): config is SseTransportConfig {
  return type === 'sse';
}

export function isStreamableHTTPTransportConfig(
  type: string,
  config: unknown,
): config is StreamableHTTPTransportConfig {
  return type === 'streamableHttp';
}

export function isWebSocketTransportConfig(type: string, config: unknown): config is WebSocketTransportConfig {
  return type === 'websocket';
}

export function isInMemoryTransportConfig(type: string, config: unknown): config is InMemoryTransportConfig {
  return type === 'inMemory';
}
