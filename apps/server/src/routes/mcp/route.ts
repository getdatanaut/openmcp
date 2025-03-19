import { getOpenMcpOpenAPIConfig, routeOpenMcpRequest } from '@openmcp/cloudflare';
import { Hono } from 'hono';

const app = new Hono<{ Bindings: Env }>()
  /**
   * Configure a new MCP instance,
   * then route to establish an SSE connection to it
   *
   * @example GET /mcp/openapi/sse
   */
  .get('/:mcpServerId/sse', async c => {
    return routeOpenMcpRequest(c.req.raw, {
      openapi: {
        namespace: c.env.OpenMcpOpenAPI,
        getMcpConfig: getOpenMcpOpenAPIConfig,
      },
    });
  })
  /**
   * Establish an SSE connection to exissting MCP instance
   *
   * @example GET /mcp/openapi/123/sse
   */
  .get('/:mcpServerId/:doId/sse', async c => {
    return routeOpenMcpRequest(c.req.raw, {
      openapi: {
        namespace: c.env.OpenMcpOpenAPI,
        getMcpConfig: getOpenMcpOpenAPIConfig,
      },
    });
  })
  /**
   * Send messages to an existing MCP instance
   *
   * @example POST /mcp/openapi/123/messages
   */
  .post('/:mcpServerId/:doId/messages', async c => {
    return routeOpenMcpRequest(c.req.raw, {
      openapi: {
        namespace: c.env.OpenMcpOpenAPI,
        getMcpConfig: getOpenMcpOpenAPIConfig,
      },
    });
  });

export default app;
