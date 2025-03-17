import { createMiddleware } from 'hono/factory';

import { SessionId } from '../../lib/session.ts';
import { isMcpServerId, McpServerConfigs, MCPServerIdToDoNamespace } from '../../mcp/index.ts';
import { type OpenMcpOpenAPI } from '../../mcp/openapi.ts';
import type { Variables as MiddlewareVariables } from '../../middleware.ts';

export type McpRouteVariables = MiddlewareVariables & { mcpServer: DurableObjectStub<OpenMcpOpenAPI> };

/**
 * Middleware to configure a specific MCP Server Durable Object from `mcpServerId` path parameter.
 */
export const configureMcpServerById = createMiddleware<{
  Bindings: Env;
  Variables: McpRouteVariables;
}>(async (c, next) => {
  const mcpServerId = c.req.param('mcpServerId');
  if (!mcpServerId || !isMcpServerId(mcpServerId)) {
    return c.json({ error: 'Invalid MCP Server' }, { status: 400 });
  }

  // Extract the server config from the request
  const config = McpServerConfigs[mcpServerId](c.req);
  if (!config) {
    return c.json({ error: 'Missing required configuration for MCP Server' }, { status: 400 });
  }

  const doId = c.env[MCPServerIdToDoNamespace[mcpServerId]].idFromName(JSON.stringify(config));
  const mcpServer = c.env[MCPServerIdToDoNamespace[mcpServerId]].get(doId);
  await mcpServer.configureMcpServer(config);

  c.set('mcpServer', mcpServer);
  c.set('sessionId', SessionId.encode({ doId, mcpServerId }));

  await next();
});

/**
 * Middleware to configure a specific MCP Server Durable Object from `mcpServerId` path parameter.
 */
export const configureMcpServerByDoId = createMiddleware<{
  Bindings: Env;
  Variables: McpRouteVariables;
}>(async (c, next) => {
  const mcpServerId = c.req.param('mcpServerId');
  const durableObjectId = c.req.param('doId');

  if (!durableObjectId || !mcpServerId || !isMcpServerId(mcpServerId)) {
    return c.json({ error: 'Invalid MCP Server' }, { status: 400 });
  }

  const maybeSessionId = c.req.query('sessionId');
  const validSessionId =
    maybeSessionId && SessionId.isValid(maybeSessionId, { doId: durableObjectId, mcpServerId }) ? maybeSessionId : null;

  const doId = c.env[MCPServerIdToDoNamespace[mcpServerId]].idFromString(durableObjectId);
  const mcpServer = c.env[MCPServerIdToDoNamespace[mcpServerId]].get(doId);

  c.set('mcpServer', mcpServer);
  // Reuse sessionId if it is valid, otherwise create a new one
  c.set('sessionId', validSessionId || SessionId.encode({ doId, mcpServerId }));

  return next();
});
