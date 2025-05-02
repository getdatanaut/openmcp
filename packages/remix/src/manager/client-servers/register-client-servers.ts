import { type McpManager } from '@openmcp/manager';

import type { Config, RemixServer } from '../../config/index.ts';
import { ClientServerRegistrationError } from '../../errors.ts';
import ScopedClientServer from './scoped-client-server.ts';

async function registerClientServer(manager: McpManager, name: string, server: RemixServer) {
  const clientId = `${name}-client`;
  const serverId = name;
  const clientServer = new ScopedClientServer(
    {
      id: `${clientId}-${serverId}`,
      clientId,
      serverId,
      serverConfig: server.type === 'openapi' ? server.serverConfig : {},
      enabled: true,
    },
    { manager },
    server.tools?.map(tool => (typeof tool === 'string' ? tool : tool.name)) ?? null,
  );
  try {
    await clientServer.connect();
  } catch (error) {
    console.warn(`Error establishing connection with ${JSON.stringify(name)}: ${String(error)}`);
  }

  await manager.clientServers.add(clientServer);
  return clientServer;
}

export default async function registerClientServers(manager: McpManager, { servers }: Config) {
  const nameClientServerPairs = Object.entries(servers);
  const results = await Promise.allSettled(
    nameClientServerPairs.map(([name, server]) => registerClientServer(manager, name, server)),
  );

  const errors: ClientServerRegistrationError[] = [];
  const clients: ScopedClientServer[] = [];
  for (const [i, result] of results.entries()) {
    if (result.status === 'rejected') {
      errors.push(new ClientServerRegistrationError(nameClientServerPairs[i]![0], result.reason));
    } else {
      clients.push(result.value);
    }
  }

  if (errors.length > 0) {
    throw new AggregateError(errors, 'Failed to register some client servers');
  }

  return clients;
}
