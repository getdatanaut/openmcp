import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { DurableObject } from 'cloudflare:workers';

import { SSEServerTransport } from './transports/sse.ts';
import { StreamableHTTPServerTransport } from './transports/streamable-http.ts';
import type { SessionId } from './utils/session.ts';

interface McpServerImpl {
  connect: (transport: Transport) => Promise<void>;
}

/**
 * Base class for OpenMcpDurableObjects
 */
export abstract class OpenMcpDurableObject<
  Env = unknown,
  ServerConfig extends Record<string, unknown> = Record<string, unknown>,
  ServerImpl extends McpServerImpl = McpServerImpl,
> extends DurableObject<Env> {
  config!: ServerConfig;

  #sessions: Map<SessionId, { transport: SSEServerTransport | StreamableHTTPServerTransport; config?: ServerConfig }> =
    new Map();

  /**
   * Create a new MCP Server
   */
  abstract createMcpServer({
    config,
    sessionId,
  }: {
    config: ServerConfig;
    sessionId: SessionId | undefined;
  }): Promise<ServerImpl>;

  /**
   * @private
   */
  async _init({ config }: { config: ServerConfig }) {
    this.config = config;
  }

  /**
   * Get a session by session ID
   */
  getSession(sessionId: SessionId) {
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
    const sessionId = request.headers.get('mcp-session-id') as SessionId;

    if (request.method === 'GET' && url.pathname.endsWith('/sse')) {
      return this.#handleSse(sessionId, request);
    }

    if (request.method === 'POST' && url.pathname.endsWith('/messages')) {
      return this.#handleSseMessages(sessionId, request);
    }

    if (url.pathname.endsWith('/stream')) {
      return this.#handleStreamableHttp(sessionId, request);
    }

    return new Response('Not found', { status: 404 });
  }

  /**
   * Handles incoming SSE requests.
   *
   * This should be called when a SSE request is made to establish a connection to the server.
   */
  async #handleSse(sessionId: SessionId, request: Request): Promise<Response> {
    if (!this.config) {
      throw new Error('MCP Server not configured');
    }

    const basePath = new URL(request.url).pathname.replace(/\/sse$/, '');
    const endpoint = [basePath, 'messages'].filter(Boolean).join('/');
    const transport = new SSEServerTransport(endpoint, sessionId);

    const server = await this.createMcpServer({ config: this.config, sessionId });
    await server.connect(transport);

    this.#sessions.set(sessionId, { transport });

    return transport.getResponse() ?? new Response('SSE connection not established', { status: 500 });
  }

  /**
   * Handles incoming SSE messages.
   *
   * This should be called when a POST request is made to send a message to the server.
   */
  async #handleSseMessages(sessionId: SessionId, request: Request): Promise<Response> {
    const session = this.#sessions.get(sessionId);
    const transport = session?.transport;
    if (!transport || !(transport instanceof SSEServerTransport)) {
      return new Response('SSE connection not established', { status: 500 });
    }

    this.#sessions.set(sessionId, {
      transport,
      config: this.#getClientConfig(request),
    });

    return transport.handlePostMessage(request);
  }

  /**
   *
   */
  async #handleStreamableHttp(sessionId: SessionId, request: Request): Promise<Response> {
    if (!this.config) {
      throw new Error('MCP Server not configured');
    }

    const existingTransport = this.#sessions.get(sessionId)?.transport;
    if (existingTransport instanceof StreamableHTTPServerTransport) {
      this.#sessions.set(sessionId, {
        transport: existingTransport,
        config: this.#getClientConfig(request),
      });

      return existingTransport.handleRequest(request);
    }

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => sessionId,
    });

    this.#sessions.set(sessionId, {
      transport,
      config: this.#getClientConfig(request),
    });
    const server = await this.createMcpServer({ config: this.config, sessionId });
    await server.connect(transport);

    return transport.handleRequest(request);
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
