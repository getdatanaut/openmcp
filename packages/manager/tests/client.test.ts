import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { Manager } from '../src/manager.ts';

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
