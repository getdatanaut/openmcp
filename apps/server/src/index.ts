import { Hono } from 'hono';

import { routeSessionToMcpServerInstance } from './middleware.ts';
import managerRoute from './routes/manager/route.ts';
import mcpRoute from './routes/mcp/route.ts';

export { OpenMcpOpenAPI } from './mcp/openapi.ts';

const app = new Hono<{ Bindings: Env }>()
  .route('/mcp', mcpRoute)
  .route('/manager', managerRoute)
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
