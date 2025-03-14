import { Client as McpClient } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { afterAll, beforeAll, describe, expect, test, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

import { createMcpServer } from '../src/index.ts';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const fixtureDir = resolve(__dirname, '__fixtures__/openapi');
const fixtures = readdirSync(fixtureDir)
  .filter(file => file.endsWith('.json'))
  .map(file => {
    return [file, require(`${fixtureDir}/${file}`)];
  });

const serverUrl = 'http://createMcpServer-test.com';
export const restHandlers = [
  http.all(`${serverUrl}/*`, () => {
    return HttpResponse.json({ success: true });
  }),
];

const server = setupServer(...restHandlers);

describe('createMcpServer', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterAll(() => server.close());
  afterEach(() => server.resetHandlers());

  test.each(fixtures)('should create a MCP server for %s', async (filename, openapi) => {
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    const server = await createMcpServer({ openapi, serverUrl });
    expect(server).toBeDefined();

    const client = new McpClient(
      {
        name: 'test-client',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    const { tools } = await client.listTools();
    await expect(tools).toMatchFileSnapshot(`./__snapshots__/openapi/${filename}.snap`);

    const toolCall = client.callTool({
      name: tools[0]!.name,
      arguments: {},
    });

    await expect(toolCall).resolves.toEqual({
      content: [
        {
          type: 'text',
          text: JSON.stringify({ success: true }, null, 2),
        },
      ],
    });
  });
});
