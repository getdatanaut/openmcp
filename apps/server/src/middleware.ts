import { createMiddleware } from 'hono/factory';

import { SessionId } from './lib/session.ts';
import type { OpenMcpOpenAPI } from './mcp/openapi.ts';

export type Variables = { sessionId: SessionId; OpenMcpOpenAPI: DurableObjectStub<OpenMcpOpenAPI> };

export type McpServers = { OpenMcpOpenAPI: OpenMcpOpenAPI };

/**
 * Routes request to the MCP Server instance based on what's decoded from the `sessionId`.
 */
export const routeSessionToMcpServerInstance = createMiddleware<{
  Bindings: Env;
  Variables: Variables;
}>(async (c, next) => {
  const sessionId = c.req.query('sessionId');
  if (!sessionId) {
    // No `sessionId` provided, so we don't know which MCP Server to route
    return next();
  }

  const { mcpServerId, doId } = SessionId.decode(sessionId);

  return c.redirect(`/mcp/${mcpServerId}/${doId}`);
});
