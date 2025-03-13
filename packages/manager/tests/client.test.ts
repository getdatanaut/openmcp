import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Manager } from '../src/manager';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

describe.only('Client', () => {
  let manager: Manager;

  beforeEach(() => {
    manager = new Manager({
      id: 'test',
      transports: {
        inMemory: {},
      },
    });
  });

  it('listTools() should list tools from MCP Servers configured by the Client', async () => {
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
      createServer: config => {
        const server = new McpServer({
          name: 'Test Server 1',
          version: '1.0.0',
          capabilities: {
            tools: {},
          },
        });

        return server;
      },
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

    const client = manager.registerClient({
      id: 'test',
      servers: {
        server1: {},
      },
    });

    const tools = await client.listTools();
    expect(tools).toEqual([
      {
        server: 'server1',
        name: 'server1Tool',
        description: 'server1Tool decsription',
        inputSchema: expect.any(z.ZodObject),
      },
    ]);
  });

  it('callTool() should call the tool on the connected MCP Server', async () => {
    const server1ToolResponse = { content: [{ type: 'text', text: 'server1Tool result' }] };
    const server1Tool = vi.fn().mockResolvedValue(server1ToolResponse);

    const server1 = manager.registerServer({
      id: 'server1',
      name: 'Test Server 1',
      version: '1.0.0',
      transport: {
        type: 'inMemory',
        config: {},
      },
      configSchema: z.object({}),
      capabilities: {},
      createServer: () => {
        const server = new McpServer({
          name: 'Test Server 1',
          version: '1.0.0',
        });

        server.tool('server1Tool', server1Tool);

        return server;
      },
    });

    const client = await manager.connectClient({
      id: 'test',
      servers: {
        server1: {},
      },
    });

    const result = await client.callTool({
      name: 'server1Tool',
      input: {},
    });
    expect(server1Tool).toHaveBeenCalled();
    expect(result).toEqual(server1ToolResponse);
  });
});
