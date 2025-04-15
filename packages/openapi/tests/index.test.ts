import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { pickBy } from 'lodash';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest';

import { openApiToMcpServerOptions } from '../src/index.ts';

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
    const {
      options: { tools },
    } = await openApiToMcpServerOptions({ openapi, serverUrl });

    await expect(
      Object.entries(tools).map(([name, tool]) => ({
        name,
        hasDescription: !!tool.description,
        hasInputSchema: !!tool.parameters,
        hasOutputSchema: !!tool['output'],
        hints: pickBy(tool['annotations']?.hints, v => v),
      })),
    ).toMatchFileSnapshot(`./__snapshots__/openapi/${filename}.snap`);

    await expect(Object.values(tools)[0]!.execute({})).resolves.toHaveProperty('success', true);
  });
});
