import * as directory from '@openmcp/directory';
import { Hono } from 'hono';

const app = new Hono<{ Bindings: Env }>()
  .get('/', async c => {
    const url = new URL(c.req.url);

    return c.json(
      Object.values(directory).map(server => {
        return JSON.parse(JSON.stringify(server).replaceAll('https://datanaut.ai/api', url.origin));
      }),
    );
  })
  .get('/:serverId', async c => {
    const { serverId } = c.req.param();

    const server = Object.values(directory).find(server => server.id === serverId);
    if (!server) {
      return c.json({ error: 'Server not found' }, 404);
    }

    const url = new URL(c.req.url);
    return c.json(JSON.parse(JSON.stringify(server).replaceAll('https://datanaut.ai/api', url.origin)));
  })
  .get('/:serverId/:filename', async c => {
    const { serverId, filename } = c.req.param();

    const server = Object.values(directory).find(
      server => server.id.replace('mcp_', '') === serverId.replace('mcp_', ''),
    );
    if (!server) {
      return c.json({ error: 'Server not found' }, 404);
    }

    // Server openapi files
    const openapiFile = await import(
      `../../../../../packages/directory/src/mcp/${serverId.replace('mcp_', '')}/${filename}`
    );

    return c.json(openapiFile.default);
  });

export default app;
