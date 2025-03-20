import { Hono } from 'hono';
import { cors } from 'hono/cors';

import directoryRoute from './routes/directory/route.ts';
import llmProxyRoute from './routes/llm/route.ts';
import mcpRoute from './routes/mcp/route.ts';

export { OpenMcpOpenAPI } from '@openmcp/cloudflare';

const app = new Hono<{ Bindings: Env }>()
  // TODO(CL): need tolock down the cors to only allow the allowed origins
  .use('*', cors())
  .route('/mcp', mcpRoute)
  .route('/_/llm', llmProxyRoute)
  .route('/directory', directoryRoute)
  .get('/', async c => {
    return c.json({
      message: 'Welcome to OpenMCP!',
      docs: 'https://datanaut.ai/docs/openmcp',
      examples: 'https://datanaut.ai/docs/openmcp/examples',
      github: 'https://github.com/getdatanaut/openmcp',
      issues: 'https://github.com/getdatanaut/openmcp/issues',
    });
  });

export default app;
