import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ServerStorageData } from 'src/server.ts';
import { createMemoryStorage } from 'src/storage/memory.ts';
import type { ThreadMessageStorageData, ThreadStorageData } from 'src/threads/thread.ts';
import { beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';

import { createManager, Manager } from '../src/manager.ts';

describe('createManager()', () => {
  it('should create a manager with servers', async () => {
    const manager = createManager({
      id: 'test',
      transports: {
        inMemory: {},
      },
      servers: {
        test: {
          name: 'Test Server',
          version: '1.0.0',
          transport: {
            type: 'inMemory',
            config: {},
          },
          configSchema: z.object({}),
          capabilities: {
            tools: {},
          },
          createServer: config =>
            new McpServer({
              name: 'Test Server',
              version: '1.0.0',
              capabilities: {
                tools: {},
              },
            }),
        },
      },
    });

    expect(manager).toBeDefined();
    expect(manager.id).toBe('test');
    expect(manager.transports).toEqual({
      inMemory: {},
    });
    expect(manager.servers.size).toBe(1);
    expect(manager.servers.get('test')).toBeDefined();
  });

  it('should initialize with servers from storage', async () => {
    const manager = createManager({
      id: 'test',
      transports: {
        inMemory: {},
      },
      storage: {
        servers: createMemoryStorage<ServerStorageData>([
          {
            id: 'test',
            name: 'Test Server',
            version: '1.0.0',
            transport: {
              type: 'inMemory',
              config: {},
            },
            capabilities: {
              tools: {},
            },
            configSchema: z.object({}),
          },
        ]),
      },
    });

    await manager.intialize();

    expect(manager).toBeDefined();
    expect(manager.id).toBe('test');
    expect(manager.transports).toEqual({
      inMemory: {},
    });
    expect(manager.servers.size).toBe(1);
    expect(manager.servers.get('test')).toHaveProperty('name', 'Test Server');
  });

  it('should initialize with threads from storage', async () => {
    const manager = createManager({
      id: 'test',
      transports: {
        inMemory: {},
      },
      storage: {
        threads: createMemoryStorage<ThreadStorageData>([
          {
            id: 'test',
            clientId: 'test',
            name: 'Test Thread',
          },
        ]),
        threadMessages: createMemoryStorage<ThreadMessageStorageData>([
          {
            id: 'test',
            threadId: 'test',
            role: 'user',
            content: 'test',
            parts: [],
          },
          {
            id: 'test2',
            threadId: 'test',
            role: 'assistant',
            content: 'test2',
            parts: [],
          },
        ]),
      },
    });

    await manager.intialize();

    expect(manager).toBeDefined();
    expect(manager.id).toBe('test');
    expect(manager.transports).toEqual({
      inMemory: {},
    });
    expect(await manager.threads.list()).toEqual([
      expect.objectContaining({
        id: 'test',
        clientId: 'test',
      }),
    ]);

    const thread = await manager.threads.get({ id: 'test' });
    expect(await thread?.listMessages()).toEqual([
      expect.objectContaining({
        id: 'test',
        role: 'user',
        content: 'test',
      }),
      expect.objectContaining({
        id: 'test2',
        role: 'assistant',
        content: 'test2',
      }),
    ]);
  });
});

describe('Manager', () => {
  let manager: Manager;

  beforeEach(() => {
    manager = new Manager({
      id: 'test',
    });
  });

  it('registerServer() should create the server', async () => {
    const server = manager.registerServer({
      id: 'test',
      name: 'Test Server',
      version: '1.0.0',
      transport: {
        type: 'inMemory',
        config: {},
      },
      configSchema: z.object({}),
      capabilities: {
        tools: {},
      },
      createServer: config =>
        new McpServer({
          name: 'Test Server',
          version: '1.0.0',
          capabilities: {
            tools: {},
          },
        }),
    });

    expect(manager.servers.size).toBe(1);
    expect(manager.servers.get('test')).toBe(server);
  });

  it('registerClient() should configure client server without connecting', async () => {
    const client = manager.registerClient({
      id: 'test',
      servers: {
        test: {},
      },
    });

    expect(client.serverConnections.size).toBe(1);
    expect(client.serverConnections.get('test')?.isConnected).toBe(false);
    expect(manager.clients.size).toBe(1);
    expect(manager.clients.get('test')).toBe(client);
  });

  it('listTools() should list tools from all servers', async () => {
    manager.registerServer({
      id: 'server1',
      name: 'Test Server 1',
      version: '1.0.0',
      transport: {
        type: 'inMemory',
        config: {},
      },
      configSchema: z.object({}),
      capabilities: {
        tools: {
          server1Tool: {
            description: 'server1Tool decsription',
            inputSchema: z.object({}),
          },
        },
      },
      createServer: config =>
        new McpServer({
          name: 'Test Server 1',
          version: '1.0.0',
          capabilities: {
            tools: {},
          },
        }),
    });

    manager.registerServer({
      id: 'server2',
      name: 'Test Server 2',
      version: '1.0.0',
      transport: {
        type: 'inMemory',
        config: {},
      },
      configSchema: z.object({}),
      capabilities: {
        tools: {
          server2Tool: {
            description: 'server2Tool description',
            inputSchema: z.object({}),
          },
        },
      },
      createServer: config =>
        new McpServer({
          name: 'Test Server 2',
          version: '1.0.0',
          capabilities: {
            tools: {},
          },
        }),
    });

    const tools = await manager.listTools();
    expect(tools).toEqual([
      {
        server: 'server1',
        name: 'server1Tool',
        description: 'server1Tool decsription',
        inputSchema: expect.any(z.ZodObject),
      },
      {
        server: 'server2',
        name: 'server2Tool',
        description: 'server2Tool description',
        inputSchema: expect.any(z.ZodObject),
      },
    ]);
  });
});
