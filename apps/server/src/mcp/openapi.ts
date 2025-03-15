import { createMcpServer } from '@openmcp/openapi';
import { DurableObject } from 'cloudflare:workers';
import type { HonoRequest } from 'hono';

import type { SessionId } from '../lib/session.ts';
import { SSEServerTransport } from '../lib/sse-transport.ts';

export const getOpenMcpOpenAPIConfigFromRequest = (req: HonoRequest) => {
  const openapi = req.query('openapi');
  const baseUrl = req.query('baseUrl');

  return { openapi, baseUrl };
};

export class OpenMcpOpenAPI extends DurableObject<Env> {
  static readonly mcpServerId = 'openapi';

  #endpoint: string;
  #sessions: Map<SessionId, SSEServerTransport> = new Map();
  #config?: { openapi: string; baseUrl?: string };

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    this.#endpoint = `/mcp/${OpenMcpOpenAPI.mcpServerId}/${this.ctx.id}/messages`;
  }

  /**
   * Configure the MCP Server.
   *
   * This should be called when the MCP Server is first created.
   */
  configureMcpServer({ openapi, baseUrl }: { openapi?: string; baseUrl?: string }) {
    if (this.#config) {
      // TODO(CL): do we want to support updating the MCP Server?
      console.log('OpenMcpOpenAPI.configureMcpServer: MCP Server is already configured', this.ctx.id);
      return;
    }

    if (!openapi) {
      throw new Error('OpenAPI MCP Server requires an "openapi" url or document to be configured.');
    }

    this.#config = { openapi: openapi.trim(), baseUrl: baseUrl?.trim() };
  }

  override async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname.endsWith('/sse')) {
      return this.handleSse(url.searchParams.get('sessionId') as SessionId);
    }

    if (request.method === 'POST' && url.pathname.endsWith('/messages')) {
      return this.handlePostMessage(url.searchParams.get('sessionId') as SessionId, request);
    }

    return new Response('Not found', { status: 404 });
  }

  /**
   * Handles incoming SSE requests.
   *
   * This should be called when a SSE request is made to establish a connection to the server.
   */
  async handleSse(sessionId: SessionId): Promise<Response> {
    console.log('OpenMcpOpenAPI.handleSse:', sessionId);
    const config = this.#config;
    if (!config) {
      throw new Error('Server not initialized');
    }
    const server = await createMcpServer({ openapi: config.openapi, serverUrl: config.baseUrl });
    const transport = new SSEServerTransport(this.#endpoint, sessionId);

    transport.onerror = error => {
      console.error('OpenMcpOpenAPI.handleSse: transport error', sessionId, error);
    };

    // TODO(CL): need to handle closing the transport when the connection is closed
    transport.onclose = () => {
      console.log('OpenMcpOpenAPI.handlePostMessage: transport closed', sessionId);
      void this.#close(sessionId);
    };

    await server.connect(transport);

    this.#sessions.set(sessionId, transport);

    return transport.getResponse() ?? new Response('SSE connection not established', { status: 500 });
  }

  /**
   * Handles incoming POST messages.
   *
   * This should be called when a POST request is made to send a message to the server.
   */
  async handlePostMessage(sessionId: SessionId, request: Request): Promise<Response> {
    console.log('OpenMcpOpenAPI.handlePostMessage:', sessionId);

    const transport = this.#sessions.get(sessionId);
    if (!transport) {
      console.error('OpenMcpOpenAPI.handlePostMessage: transport not found for session', sessionId);
      return new Response('SSE connection not established', { status: 500 });
    }

    return transport.handlePostMessage(request);
  }

  async #close(sessionId: SessionId) {
    console.log('OpenMcpOpenAPI.close', sessionId);
    this.#sessions.delete(sessionId);
  }
}
