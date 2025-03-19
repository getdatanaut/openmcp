import { McpServer, type ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { z } from 'zod';

import {
  type ClientServerManager,
  type ClientServerStorageData,
  createClientServerManager,
} from '../src/client-servers.ts';
import { type CreateMcpServerFactory, createServerManager, type ServerStorageData } from '../src/servers.ts';
import { createMemoryStorage } from '../src/storage/memory.ts';

interface CTX {
  clientServerManager: ClientServerManager;

  pingServerFactory: Mock<CreateMcpServerFactory>;
  pingToolExecutor: Mock<ToolCallback>;

  pingServerFactoryV2: Mock<CreateMcpServerFactory>;
  pingToolExecutorV2: Mock<ToolCallback>;
  greetToolExecutor: Mock<ToolCallback>;
}

afterEach<CTX>(() => {
  vi.resetAllMocks();
});

const PING_PONG_SERVER_ID = 'mcp_ping_pong';
const PING_PONG_SERVERV2_ID = 'mcp_ping_pong_v2';

beforeEach<CTX>(async ctx => {
  ctx.pingToolExecutor = vi.fn<ToolCallback>((...args) => {
    return { content: [{ type: 'text', text: 'PONG' }] };
  });

  ctx.pingToolExecutorV2 = vi.fn<ToolCallback>(() => {
    return { content: [{ type: 'text', text: 'PONG V2' }] };
  });

  // @ts-expect-error ignore
  ctx.greetToolExecutor = vi.fn<ToolCallback>(({ name }) => {
    return { content: [{ type: 'text', text: `Hi ${name}` }] };
  });

  ctx.pingServerFactory = vi.fn<CreateMcpServerFactory>(config => {
    const m = new McpServer({ name: 'Ping Pong Server', version: '1.0.0' });

    m.tool('ping', ctx.pingToolExecutor);

    return m;
  });

  ctx.pingServerFactoryV2 = vi.fn<CreateMcpServerFactory>(config => {
    const m = new McpServer({ name: 'Ping Pong Server V2', version: '2.0.0' });

    m.tool('ping', ctx.pingToolExecutorV2);
    // @ts-expect-error ignore
    m.tool('greet', { name: z.string() }, ctx.greetToolExecutor);

    return m;
  });

  ctx.clientServerManager = createClientServerManager({
    manager: {
      storage: {
        clientServers: createMemoryStorage<ClientServerStorageData>(),
      },
      servers: createServerManager({
        manager: {
          storage: {
            servers: createMemoryStorage<ServerStorageData>([
              {
                id: PING_PONG_SERVER_ID,
                name: 'Ping Pong Server',
                version: '1.0.0',
                transport: { type: 'inMemory', config: {} },
              },
              {
                id: PING_PONG_SERVERV2_ID,
                name: 'Ping Pong Server V2',
                version: '2.0.0',
                transport: { type: 'inMemory', config: {} },
              },
            ]),
          },
        },
        inMemoryServerFactories: {
          [PING_PONG_SERVER_ID]: ctx.pingServerFactory,
          [PING_PONG_SERVERV2_ID]: ctx.pingServerFactoryV2,
        },
      }),
    },
  });
});

describe('ClientServer', () => {
  describe('callTool()', () => {
    it<CTX>('should work', async ({ clientServerManager, pingToolExecutor }) => {
      const clientServer = await clientServerManager.create({
        id: `client_1-${PING_PONG_SERVER_ID}`,
        clientId: 'client_1',
        serverId: PING_PONG_SERVER_ID,
        serverConfig: {},
      });

      await clientServer.callTool({ name: 'ping', input: {} });

      expect(pingToolExecutor).toHaveBeenCalled();
    });

    it<CTX>('should error if tool not found', async ({ clientServerManager }) => {
      const clientServer = await clientServerManager.create({
        id: `client_1-${PING_PONG_SERVER_ID}`,
        clientId: 'client_1',
        serverId: PING_PONG_SERVER_ID,
        serverConfig: {},
      });

      await expect(clientServer.callTool({ name: 'ping_who', input: {} })).rejects.toThrow();
    });

    it<CTX>('passes input through', async ({ clientServerManager, greetToolExecutor }) => {
      const clientServer = await clientServerManager.create({
        id: `client_1-${PING_PONG_SERVERV2_ID}`,
        clientId: 'client_1',
        serverId: PING_PONG_SERVERV2_ID,
        serverConfig: {},
      });

      await clientServer.callTool({ name: 'greet', input: { name: 'marc' } });

      expect(greetToolExecutor).toHaveBeenCalledWith(expect.objectContaining({ name: 'marc' }), expect.anything());
    });
  });

  describe('listTools()', () => {
    it<CTX>('should work', async ({ clientServerManager }) => {
      const clientServer = await clientServerManager.create({
        id: `client_1-${PING_PONG_SERVERV2_ID}`,
        clientId: 'client_1',
        serverId: PING_PONG_SERVERV2_ID,
        serverConfig: {},
      });

      const tools = await clientServer.listTools();

      expect(tools).toEqual([expect.objectContaining({ name: 'ping' }), expect.objectContaining({ name: 'greet' })]);
    });

    it<CTX>('the tools returned have an execute method on them', async ({ clientServerManager, greetToolExecutor }) => {
      const clientServer = await clientServerManager.create({
        id: `client_1-${PING_PONG_SERVERV2_ID}`,
        clientId: 'client_1',
        serverId: PING_PONG_SERVERV2_ID,
        serverConfig: {},
      });

      const tools = await clientServer.listTools();

      await tools.find(t => t.name === 'greet')!.execute({ name: 'marc' });

      expect(greetToolExecutor).toHaveBeenCalledWith(expect.objectContaining({ name: 'marc' }), expect.anything());
    });
  });
});

describe('ClientServerManager', () => {
  describe('toolsByClientId()', () => {
    it<CTX>('should return tools from all servers for a given client', async ({ clientServerManager }) => {
      await clientServerManager.create({
        id: `client_1-${PING_PONG_SERVER_ID}`,
        clientId: 'client_1',
        serverId: PING_PONG_SERVER_ID,
        serverConfig: {},
      });

      await clientServerManager.create({
        id: `client_1-${PING_PONG_SERVERV2_ID}`,
        clientId: 'client_1',
        serverId: PING_PONG_SERVERV2_ID,
        serverConfig: {},
      });

      const tools = await clientServerManager.toolsByClientId({ clientId: 'client_1' });

      expect(tools).toEqual([
        expect.objectContaining({ server: PING_PONG_SERVER_ID, name: 'ping' }),
        expect.objectContaining({ server: PING_PONG_SERVERV2_ID, name: 'ping' }),
        expect.objectContaining({ server: PING_PONG_SERVERV2_ID, name: 'greet' }),
      ]);
    });
  });
});
