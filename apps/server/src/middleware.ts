import type { OpenMcpOpenAPI } from './mcp/openapi.ts';
import { SessionId } from './lib/session.ts';
import { createMiddleware } from 'hono/factory';
import type { HonoRequest } from 'hono';

export type Variables = { sessionId: SessionId; OpenMcpOpenAPI: DurableObjectStub<OpenMcpOpenAPI> };

export type McpServers = { OpenMcpOpenAPI: OpenMcpOpenAPI };

type GetMcpServerConfig<McpServerId extends 'OpenMcpOpenAPI'> = (
  req: HonoRequest,
) => Partial<Parameters<McpServers[McpServerId]['configureMcpServer']>[0]>;

/**
 * Middleware to configure an MCP Server Durable Object.
 */
export const configureMcpServer = <McpServerId extends keyof McpServers>(
  mcpServerId: McpServerId,
  getMcpServerConfig: GetMcpServerConfig<McpServerId>,
) =>
  createMiddleware<{
    Bindings: Env;
    Variables: Variables;
  }>(async (c, next) => {
    const config = getMcpServerConfig(c.req);
    const sessionId = c.req.query('sessionId');

    if (!sessionId && !config) {
      return c.json({ error: 'Missing sessionId or MCP server configuration' }, { status: 400 });
    }

    const doId = sessionId
      ? c.env[mcpServerId].idFromString(SessionId.decode(sessionId).doId)
      : c.env[mcpServerId].idFromName(JSON.stringify(config));

    const mcpServer = c.env[mcpServerId].get(doId);
    c.set(mcpServerId, mcpServer);

    if (sessionId) {
      c.set('sessionId', sessionId as SessionId);
    } else if (config) {
      c.set('sessionId', SessionId.encode({ doId, mcpServerId }));
      await mcpServer.configureMcpServer(config);
    }

    await next();
  });
