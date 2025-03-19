import { createMcpServer } from '@openmcp/openapi';

import { OpenMcpDurableObject } from '../durable-object.ts';
import type { SessionId } from '../utils/session.ts';

export type OpenMcpOpenAPIConfig = {
  openapi: string;
  baseUrl?: string;
};

/**
 * Get the MCP Server configuration from the request
 * @param request Request to get the configuration from
 * @returns MCP Server configuration
 */
export function getOpenMcpOpenAPIConfig(request: Request) {
  const url = new URL(request.url);
  const openapi = url.searchParams.get('openapi') ?? undefined;
  const baseUrl = url.searchParams.get('baseUrl') ?? undefined;

  return { openapi, baseUrl };
}

/**
 * OpenAPI MCP DurableObject
 */
export class OpenMcpOpenAPI<
  Env = unknown,
  Config extends OpenMcpOpenAPIConfig = OpenMcpOpenAPIConfig,
> extends OpenMcpDurableObject<Env, Config> {
  mcpServerId = 'openapi';

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }

  override createMcpServer(config: Config, sessionId: SessionId) {
    return createMcpServer(config, () => {
      return this.getSession(sessionId)?.config ?? {};
    });
  }
}
