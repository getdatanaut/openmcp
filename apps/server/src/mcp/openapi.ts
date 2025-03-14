import { DurableObject } from 'cloudflare:workers';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { createMcpServer } from '@openmcp/openapi';
import { AsyncLocalStorage } from 'node:async_hooks';
import { SSEServerTransport } from '../lib/sse-transport.ts';
import type { SessionId } from '../lib/session.ts';

// TODO(CL): double check if AsyncLocalStorage is needed
export const OpenMcpOpenApiContext = new AsyncLocalStorage<SSEServerTransport>();

export class OpenMcpOpenAPI extends DurableObject<Env> {
  #config?: { openapi: string; baseUrl?: string };
  #mcpServers: Map<SessionId, McpServer> = new Map();
  #transports: Map<SessionId, SSEServerTransport> = new Map();

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }

  /**
   * Configure the MCP Server.
   *
   * This should be called when the MCP Server is first created.
   */
  configureMcpServer({ openapi, baseUrl }: { openapi?: string; baseUrl?: string }) {
    if (this.#config) {
      // TODO(CL): do we want to support updating the MCP Server?
      console.log('McpOpenAPI is already configured with an OpenAPI and base URL', this.ctx.id);
      return;
    }

    if (!openapi) {
      throw new Error('OpenAPI MCP Server requires an "openapi" url or document to be configured.');
    }

    this.#config = { openapi, baseUrl };
  }

  /**
   * Handles incoming SSE requests.
   *
   * This should be called when a SSE request is made to establish a connection to the server.
   */
  async handleSse(sessionId: SessionId): Promise<Response> {
    const config = this.#config;
    if (!config) {
      throw new Error('Server not initialized');
    }

    const transport = new SSEServerTransport('/messages', sessionId);
    this.#transports.set(sessionId, transport);

    return OpenMcpOpenApiContext.run(transport, async () => {
      const server = await createMcpServer({ openapi: config.openapi, serverUrl: config.baseUrl });
      this.#mcpServers.set(sessionId, server);

      await server.connect(transport);

      return transport.getResponse() ?? new Response('SSE connection not established', { status: 500 });
    });
  }

  /**
   * Handles incoming POST messages.
   *
   * This should be called when a POST request is made to send a message to the server.
   */
  async handlePostMessage(sessionId: SessionId, request: Request): Promise<Response> {
    const transport = this.#transports.get(sessionId);
    if (!transport) {
      return new Response('SSE connection not established', { status: 500 });
    }

    return OpenMcpOpenApiContext.run(transport, async () => {
      return transport.handlePostMessage(request);
    });
  }
}
