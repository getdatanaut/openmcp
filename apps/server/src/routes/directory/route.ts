import { firecrawl, openapi, petstore, pokemon, serpapi, slack } from '@openmcp/directory';
import { Hono } from 'hono';

const app = new Hono<{ Bindings: Env }>()
  .get('/', async c => {
    const url = new URL(c.req.url);
    const directory = [firecrawl, openapi, petstore, pokemon, serpapi, slack];

    return c.json(
      directory.map(server => {
        return JSON.parse(JSON.stringify(server).replaceAll('https://datanaut.ai/api', url.origin));
      }),
    );
  })
  .get('/:serverId/:filename', async c => {
    const { serverId, filename } = c.req.param();

    // Server openapi files
    const openapiFile = await import(`../../../../../packages/directory/src/mcp/${serverId}/${filename}`);

    return c.json(openapiFile.default);
  });

export default app;
