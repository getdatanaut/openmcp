import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  type ImplementationSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { type ClientServer, createMcpManager, type McpManager, type Tool } from '@openmcp/manager';
import type { z } from 'zod';

import { observeToolListChanged, registerClientServers } from './client-servers/index.ts';
import type { Config } from './config/index.ts';
import { registerServers } from './servers/index.ts';
import { parseToolName } from './utils/tools.ts';

class RemixServer extends Server {
  #manager: McpManager;

  constructor(impl: z.infer<typeof ImplementationSchema>, manager: McpManager) {
    super(impl, {
      capabilities: {
        tools: {
          listChanged: true,
        },
      },
    });

    this.#manager = manager;
  }

  override async close(): Promise<void> {
    await Promise.allSettled([this.#manager.close(), await super.close()]);
  }
}

export default async function createRemixServer(
  impl: z.infer<typeof ImplementationSchema>,
  config: Config,
): Promise<Server> {
  const manager = createMcpManager({
    id: String(Date.now()),
  });

  try {
    await registerServers(manager, config);
  } catch (error) {
    console.log('Error registering servers:', error);
    throw error;
  }

  let server: RemixServer | null = null;
  try {
    const clientServers = await registerClientServers(manager, config);
    observeToolListChanged(clientServers, async () => {
      await server?.notification({ method: 'notifications/tools/list_changed' });
    });
  } catch (error) {
    console.log('Error registering client servers:', error);
    throw error;
  }

  server = new RemixServer(impl, manager);

  registerListToolsHandler(server, manager);
  registerCallToolHandler(server, manager);

  return server;
}

function registerListToolsHandler(server: Server, manager: McpManager) {
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const tools: Tool[] = [];
    let clients: ClientServer[];
    try {
      clients = await manager.clientServers.findMany({ enabled: true });
    } catch (error) {
      console.error('Error finding client servers:', error);
      return { tools };
    }

    await Promise.all(
      clients.map(async client => {
        const clientId = client.clientId;
        try {
          tools.push(...(await client.listTools()));
        } catch (error) {
          console.warn(`Error listing tools for client server "${clientId}": ${error}`);
        }
      }),
    );

    return { tools };
  });
}

function registerCallToolHandler(server: Server, manager: McpManager) {
  server.setRequestHandler(CallToolRequestSchema, async request => {
    const { name, arguments: input } = request.params;
    let serverId: string;
    let toolName: string;
    try {
      [serverId, toolName] = parseToolName(name);
    } catch (error) {
      console.error('Error parsing tool name:', error);
      return {
        content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }

    const res = await manager.clientServers.callTool({
      serverId,
      clientId: `${serverId}-client`,
      name: toolName,
      input,
    });

    if (!res) {
      console.error(`Error calling tool: No response from tool ${toolName}`);
      return {
        content: [{ type: 'text', text: 'Error: No response from tool' }],
        isError: true,
      };
    }

    return res;
  });
}
