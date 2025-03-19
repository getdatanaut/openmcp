import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { DurableObject } from 'cloudflare:workers';

import { SSEServerTransport } from './transports/sse.ts';
import type { SessionId } from './utils/session.ts';

/**
 * Base class for OpenMcpDurableObjects
 */
export abstract class OpenMcpDurableObject<Env = unknown, Config = unknown> extends DurableObject<Env> {
  abstract readonly mcpServerId: string;
  readonly baseUrl: string = '/mcp';

  config?: Config;

  #sessions: Map<SessionId, { transport: SSEServerTransport; config?: Config }> = new Map();

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }

  /**
   * Create a new MCP Server
   */
  abstract createMcpServer(config: Config, sessionId: SessionId): Promise<McpServer>;

  /**
   * Set the MCP Server configuration.
   */
  public setConfig(config: Config) {
    // TODO(CL): do we want to support updating the MCP Server?
    if (this.config) return;

    this.config = config;
  }

  /**
   * Get a session by session ID
   */
  public getSession(sessionId: SessionId) {
    return this.#sessions.get(sessionId);
  }

  /**
   * Close a session by session ID
   */
  async closeSession(sessionId: SessionId) {
    const session = this.#sessions.get(sessionId);
    if (!session) return;

    await session.transport.close();
    this.#sessions.delete(sessionId);
  }

  /**
   * Handle incoming requests
   */
  override async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId') as SessionId;

    if (request.method === 'GET' && url.pathname.endsWith('/sse')) {
      return this.handleSse(sessionId, request);
    }

    if (request.method === 'POST' && url.pathname.endsWith('/messages')) {
      return this.handleSseMessages(sessionId, request);
    }

    return new Response('Not found', { status: 404 });
  }

  /**
   * Handles incoming SSE requests.
   *
   * This should be called when a SSE request is made to establish a connection to the server.
   */
  protected async handleSse(sessionId: SessionId, request: Request): Promise<Response> {
    if (!this.config) {
      throw new Error('MCP Server not configured');
    }

    const endpoint = [this.baseUrl, this.mcpServerId, this.ctx.id, 'messages'].filter(Boolean).join('/');
    const transport = new SSEServerTransport(endpoint, sessionId);

    const server = await this.createMcpServer(this.config, sessionId);
    await server.connect(transport);

    this.#sessions.set(sessionId, { transport });

    return transport.getResponse() ?? new Response('SSE connection not established', { status: 500 });
  }

  /**
   * Handles incoming SSE messages.
   *
   * This should be called when a POST request is made to send a message to the server.
   */
  protected async handleSseMessages(sessionId: SessionId, request: Request): Promise<Response> {
    const session = this.#sessions.get(sessionId);
    if (!session?.transport) {
      return new Response('SSE connection not established', { status: 500 });
    }

    this.#sessions.set(sessionId, {
      transport: session.transport,
      config: this.#getClientConfig(request),
    });

    return session.transport.handlePostMessage(request);
  }

  #getClientConfig(request: Request) {
    const userConfigHeader = request.headers.get('x-openmcp') || '';
    try {
      return JSON.parse(userConfigHeader);
    } catch {
      return null;
    }
  }
}
