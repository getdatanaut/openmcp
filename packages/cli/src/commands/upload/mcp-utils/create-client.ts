import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';

import packageJson from '../../../../package.json' with { type: 'json' };

interface ServerAnnotations {
  // https://github.com/modelcontextprotocol/modelcontextprotocol/blob/dfd270157380c645d0731f9f2ffbc89f75fba47d/schema/2025-03-26/schema.ts#L177
  serverName?: string;
  iconUrl?: string;
  [key: string]: unknown;
}

export type ConnectedClient = Pick<
  Client,
  'listTools' | 'listPrompts' | 'listResources' | 'listResourceTemplates' | 'getServerVersion' | 'getServerCapabilities'
> & {
  getServerAnnotations(): ServerAnnotations | undefined;
} & AsyncDisposable;

export default async function createConnectedClient(
  transport: Transport,
  annotations: Record<string, unknown>,
): Promise<ConnectedClient> {
  const client = new Client({
    name: packageJson.name,
    version: packageJson.version,
  });

  try {
    await client.connect(transport);
  } catch (error) {
    throw new Error(`Failed to connect to server: ${error}`);
  }

  return {
    getServerAnnotations(): ServerAnnotations | undefined {
      return {
        // will work once SDK adds support for server annotations this should work
        ...client['getServerAnnotations']?.(),
        ...annotations,
      };
    },
    getServerCapabilities: client.getServerCapabilities.bind(client),
    getServerVersion: client.getServerVersion.bind(client),
    listTools: client.listTools.bind(client),
    listPrompts: client.listPrompts.bind(client),
    listResources: client.listResources.bind(client),
    listResourceTemplates: client.listResourceTemplates.bind(client),
    async [Symbol.asyncDispose]() {
      await client.close();
    },
  };
}
