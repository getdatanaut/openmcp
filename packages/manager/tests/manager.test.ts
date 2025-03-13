import { describe, it, expect, beforeEach } from 'vitest';
import { createManager, Manager } from '../src/manager';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

describe('createManager()', () => {
  it('should create a manager with servers', () => {
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
