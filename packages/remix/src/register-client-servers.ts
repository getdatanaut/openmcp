import {
  ClientServer,
  type ClientServerOptions,
  type ClientServerStorageData,
  type McpManager,
  type Tool,
} from '@openmcp/manager';

import type { Config, RemixServer } from './config/index.ts';
import { ClientServerRegistrationError } from './errors.ts';
import { resolveToolName } from './utils/tools.ts';

class ScopedClientServer extends ClientServer {
  readonly #allowedTools: string[] = [];

  constructor(data: ClientServerStorageData, options: ClientServerOptions, allowedTools: string[]) {
    super(data, options);
    this.#allowedTools = allowedTools;
  }

  override async listTools(): Promise<Tool[]> {
    const tools = await super.listTools({ lazyConnect: true });
    const exposedToolNames = new Set<string>();
    const exposedTools: Tool[] = [];
    for (const tool of tools) {
      if (!this.#allowedTools.includes(tool.name)) continue;

      const resolvedToolName = resolveToolName(this.serverId, tool.name);
      if (exposedToolNames.has(tool.name)) {
        // todo: we could try to handle it by renaming the tool
        throw new Error(`Tool name collision: ${tool.name} and ${resolvedToolName}`);
      }

      exposedToolNames.add(resolvedToolName);
      exposedTools.push({
        ...tool,
        name: resolvedToolName,
      });
    }

    return exposedTools;
  }
}

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
    server.tools.map(tool => tool.name),
  );
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
