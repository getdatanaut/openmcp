import { Hono } from 'hono';

import { configureMcpServerByDoId, configureMcpServerById, type McpRouteVariables } from './middleware.ts';

const app = new Hono<{ Bindings: Env; Variables: McpRouteVariables }>()
  /**
   * Configure a new MCP instance,
   * then route to establish an SSE connection to it
   *
   * @example GET /mcp/openapi/sse
   */
  .get(
    '/:mcpServerId/sse',
    configureMcpServerById,
    // @ts-expect-error -- TODO(CL): make typescript happy
    async c => {
      const mcpServer = c.get('mcpServer');
      const sessionId = c.get('sessionId');

      // TODO(CL): we could offer an endpoint to configure the MCP instance without connecting too
      // Route to the endpoint for handling this MCP Server instance
      return mcpServer.handleSse(sessionId);
    },
  )
  /**
   * Establish an SSE connection to exissting MCP instance
   *
   * @example GET /mcp/openapi/123/sse
   */
  .get(
    '/:mcpServerId/:doId/sse',
    configureMcpServerByDoId,
    // @ts-expect-error -- TODO(CL): make typescript happy
    async c => {
      const mcpServer = c.get('mcpServer');
      const sessionId = c.get('sessionId');

      return mcpServer.handleSse(sessionId);
    },
  )
  /**
   * Send messages to an existing MCP instance
   *
   * @example POST /mcp/openapi/123/messages
   */
  .post(
    '/:mcpServerId/:doId/messages',
    configureMcpServerByDoId,
    // @ts-expect-error -- TODO(CL): make typescript happy
    async c => {
      const mcpServer = c.get('mcpServer');
      const sessionId = c.get('sessionId');

      return mcpServer.handlePostMessage(sessionId, c.req.raw);
    },
  );

export default app;
