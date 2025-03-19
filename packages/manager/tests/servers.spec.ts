import { McpServer, type ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import {
  type CreateMcpServerFactory,
  createServerManager,
  type ServerManager,
  type ServerStorageData,
} from '../src/servers.ts';
import { createMemoryStorage } from '../src/storage/memory.ts';

interface CTX {
  serverManager: ServerManager;
  pingToolExecutor: Mock<ToolCallback>;
  pingServerFactory: Mock<CreateMcpServerFactory>;
}

afterEach<CTX>(() => {
  vi.resetAllMocks();
});

beforeEach<CTX>(async ctx => {
  ctx.pingToolExecutor = vi.fn<ToolCallback>(() => {
    return { content: [{ type: 'text', text: 'PONG' }] };
  });

  ctx.pingServerFactory = vi.fn<CreateMcpServerFactory>(config => {
    const m = new McpServer({ name: 'Ping Pong Server', version: '1.0.0' });

    m.tool('ping', ctx.pingToolExecutor);

    return m;
  });

  ctx.serverManager = createServerManager({
    manager: {
      storage: {
        servers: createMemoryStorage<ServerStorageData>(),
      },
    },

    inMemoryServerFactories: {
      mcp_ping_pong: ctx.pingServerFactory,
    },
  });
});

describe('Server', () => {
  describe('callTool()', () => {
    it<CTX>('should work', async ({ serverManager, pingToolExecutor }) => {
      const server = await serverManager.create({
        id: 'mcp_ping_pong',
        name: 'Test Server',
        version: '1.0.0',
        transport: { type: 'inMemory', config: {} },
      });

      await server.callTool({ name: 'ping', input: {}, config: {} });

      expect(pingToolExecutor).toHaveBeenCalled();
    });

    it<CTX>('should throw if a memory transport server does not have a createServer factory', async ({
      serverManager,
    }) => {
      const server = await serverManager.create({
        id: 'mcp_random', // this id is not registered in the inMemoryServerFactories
        name: 'Test Server',
        version: '1.0.0',
        transport: { type: 'inMemory', config: {} },
      });

      await expect(server.callTool({ name: 'ping', input: {}, config: {} })).rejects.toThrow();
    });
  });
});
