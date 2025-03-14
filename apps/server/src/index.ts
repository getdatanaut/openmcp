import { Hono } from 'hono';
import { configureMcpServer } from './middleware.ts';

export { OpenMcpOpenAPI } from './mcp/openapi.ts';

const app = new Hono<{ Bindings: Env }>()
  .use(
    configureMcpServer('OpenMcpOpenAPI', req => {
      const openapi = req.query('openapi');
      const baseUrl = req.query('baseUrl');

      return { openapi, baseUrl };
    }),
  )
  .get(
    '/sse',
    // @ts-expect-error -- TODO(CL): make typescript happy
    async c => {
      const mcpServer = c.get('OpenMcpOpenAPI');
      const sessionId = c.get('sessionId');

      return mcpServer.handleSse(sessionId);
    },
  )
  .post(
    '/messages',
    // @ts-expect-error -- TODO(CL): make typescript happy
    async c => {
      const mcpServer = c.get('OpenMcpOpenAPI');
      const sessionId = c.get('sessionId');

      return mcpServer.handlePostMessage(sessionId, c.req.raw);
    },
  );

export default app;
