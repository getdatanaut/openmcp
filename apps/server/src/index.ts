import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { routeSessionToMcpServerInstance } from './middleware.ts';
import chatCompletionsRoute from './routes/chat/completions/route.ts';
import managerRoute from './routes/manager/route.ts';
import mcpRoute from './routes/mcp/route.ts';

export { OpenMcpOpenAPI } from './mcp/openapi.ts';

const app = new Hono<{ Bindings: Env }>()
  // TODO(CL): need tolock down the cors to only allow the allowed origins
  .use('*', cors())
  .route('/mcp', mcpRoute)
  .route('/manager', managerRoute)
  .route('/v1/chat/completions', chatCompletionsRoute)
  .get('/', routeSessionToMcpServerInstance, async c => {
    return c.json({
      message: 'Welcome to OpenMCP!',
      docs: 'https://datanaut.ai/docs/openmcp',
      examples: 'https://datanaut.ai/docs/openmcp/examples',
      github: 'https://github.com/getdatanaut/openmcp',
      issues: 'https://github.com/getdatanaut/openmcp/issues',
    });
  });

export default app;
