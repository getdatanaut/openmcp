import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { createMcpManager, type Tool } from '@openmcp/manager';

import type { Config } from './config/index.ts';
import registerClientServers from './register-client-servers.ts';
import registerServers from './register-servers.ts';

export default async function createRemixServer(config: Config): Promise<Server> {
  const manager = createMcpManager({
    id: String(Date.now()),
  });

  await registerServers(manager, config);
  const clients = await registerClientServers(manager, config);

  const server = new Server(
    {
      name: 'openmcp-remix',
      version: '0.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  const tools: Tool[] = [];
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    // todo: acquire a mutex lock here unless it's a one-shot operation
    try {
      const newTools: Tool[] = [];
      await Promise.all(
        clients.map(async client => {
          newTools.push(...(await client.listTools()));
        }),
      );
      tools.splice(0, tools.length, ...newTools);
      // maybe just update the ones that succeeded instead of failing entirely?
    } catch (ex) {
      if (tools.length === 0) {
        return {
          content: [{ type: 'text', text: `Error: ${String(ex)}` }],
          isError: true,
        };
      }
    }

    return { tools };
  });

  server.setRequestHandler(CallToolRequestSchema, async request => {
    const { name, arguments: input } = request.params;
    // todo: proper split name by server id and tool name with validation and everything
    const [serverId, toolName] = name.split('-') as [string, string];
    const res = await manager.clientServers.callTool({
      serverId,
      // todo: tidy this up
      clientId: `${serverId}-client-${serverId}`,
      name: toolName,
      input,
    });

    if (!res) {
      return {
        content: [{ type: 'text', text: 'Error: No response from tool' }],
        isError: true,
      };
    }

    return res;
  });

  return server;
}
