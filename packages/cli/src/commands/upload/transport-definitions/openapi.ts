import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';
import { openApiToMcpServerOptions } from '@openmcp/openapi';
import { OpenMcpServer } from '@openmcp/server';

import type { TransportDefinition } from './types.ts';

export type OpenAPITransportDefinition = TransportDefinition<'openapi'>;

export default async function createOpenAPITransportDefinition(
  uri: string,
  serverUrl: string | undefined,
): Promise<OpenAPITransportDefinition> {
  const { service, options } = await openApiToMcpServerOptions({
    openapi: uri,
    serverUrl,
  });

  const resolvedServerUrl = serverUrl ?? getServerUrl(service.servers);
  if (!resolvedServerUrl) {
    throw new Error('Server URL must be provided, or the the OpenAPI specification must contain a server definition.');
  }

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = new OpenMcpServer(options);
  await server.connect(clientTransport);

  return {
    transport: new OpenAPIClientTransport(server, serverTransport),
    transportConfig: {
      type: 'openapi',
      serverConfig: {
        openapi: uri,
        serverUrl: resolvedServerUrl,
      },
    },
    configSchema: undefined,
    externalId: resolvedServerUrl,
  };
}

export class OpenAPIClientTransport implements Transport {
  #server: OpenMcpServer;
  #transport: InMemoryTransport;

  constructor(server: OpenMcpServer, transport: InMemoryTransport) {
    this.#server = server;
    this.#transport = transport;
  }

  send(message: JSONRPCMessage) {
    return this.#transport.send(message);
  }

  start() {
    return this.#transport.start();
  }

  async close() {
    await Promise.all([this.#server.close(), this.#transport.close()]);
  }
}

function getServerUrl(servers?: { url: string }[]): string | undefined {
  if (Array.isArray(servers) && servers.length > 0) {
    return servers[0]!.url;
  }

  return;
}
