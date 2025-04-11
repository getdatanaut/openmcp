import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  type ImplementationSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { createMcpManager, type McpManager } from '@openmcp/manager';
import type { z } from 'zod';

import type { Config } from './config/index.ts';
import registerClientServers from './register-client-servers.ts';
import registerServers from './register-servers.ts';
import { parseToolName } from './utils/tools.ts';

class RemixServer extends Server {
  #manager: McpManager;

  constructor(impl: z.infer<typeof ImplementationSchema>, manager: McpManager) {
    super(impl, {
      capabilities: {
        tools: {},
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

  await registerServers(manager, config);
  await registerClientServers(manager, config);
  const server = new RemixServer(impl, manager);

  registerListToolsHandler(server, manager);
  registerCallToolHandler(server, manager);

  return server;
}

function registerListToolsHandler(server: Server, manager: McpManager) {
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    // todo: should we acquire a mutex lock?
    try {
      const tools = Object.values(await manager.clientServers.tools({ lazyConnect: true })).flat();
      return { tools };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error: ${String(error)}` }],
        isError: true,
      };
    }
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
      return {
        content: [{ type: 'text', text: 'Error: No response from tool' }],
        isError: true,
      };
    }

    return res;
  });
}
