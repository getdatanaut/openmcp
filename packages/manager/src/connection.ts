import { Client as McpClient } from '@modelcontextprotocol/sdk/client/index.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { z } from 'zod';

import type { ClientId } from './client.ts';
import type { Manager } from './manager.ts';
import type { ServerConfig, ServerId } from './server.ts';
import { createTransport } from './transport.ts';

export type ToolName = string;

export interface ConnectionConfig {
  clientId: ClientId;
  serverId: ServerId;
  config: z.infer<ServerConfig['configSchema']>;
}

export class Connection {
  public readonly clientId: ClientId;
  public readonly serverId: ServerId;
  public readonly config: z.infer<ServerConfig['configSchema']>;

  private readonly manager: Manager;

  #mcpClient?: McpClient;
  #mcpServer?: McpServer;

  constructor(config: ConnectionConfig, manager: Manager) {
    this.clientId = config.clientId;
    this.serverId = config.serverId;
    this.config = config.config;
    this.manager = manager;
  }

  public get isConnected() {
    return !!this.#mcpClient;
  }

  /**
   * Connect to the MCP Server
   */
  public async connect() {
    if (this.isConnected) {
      throw new Error('Client is already connected');
    }

    const server = this.manager.getServer(this.serverId);
    if (!server) {
      throw new Error(`Server "${this.serverId}" not found`);
    }

    const client = this.manager.getClient(this.clientId);
    if (!client) {
      throw new Error(`Client "${this.clientId}" not found`);
    }

    /**
     * Create optional MCP Server defined by the server's config
     */
    const mcpServer = server.createServer?.(this.config);
    this.#mcpServer = mcpServer;

    /**
     * Create an MCP client to proxy requests to the MCP Server
     */
    const mcpClient = new McpClient({
      name: `${client.id}-${server.id}-proxy`,
      version: server.version,
    });
    this.#mcpClient = mcpClient;

    /**
     * Connect the MCP Client and MCP Server using the server's defined transport
     */
    const { clientTransport, serverTransport } = createTransport(server.transport.type, server.transport.config);

    // Connect to the MCP Server _before_ connecting the MCP Client,
    // otherwise the MCP Client will fail to find the MCP Server.
    await mcpServer?.server.connect(serverTransport);
    await mcpClient.connect(clientTransport);
  }

  /**
   * Get the server capabilities
   */
  public getServerCapabilities() {
    return this.#mcpClient?.getServerCapabilities();
  }

  /**
   * List tools available from the server
   */
  public async listTools() {
    if (!this.isConnected || !this.#mcpClient) {
      // If the client is not connected, return the tools from the server
      const server = this.manager.getServer(this.serverId);
      return server?.listTools();
    }

    const { tools } = await this.#mcpClient.listTools();
    return tools.map(tool => ({
      ...tool,
      server: this.serverId,
    }));
  }

  /**
   * Call a tool on the server
   */
  public async callTool(config: { name: ToolName; input: z.infer<z.AnyZodObject> }) {
    return this.#mcpClient?.callTool({
      name: config.name,
      arguments: config.input,
    });
  }

  /**
   * Disconnect from the server.
   */
  public async disconnect() {
    await this.#mcpClient?.close();
    await this.#mcpServer?.close();
    this.#mcpServer = undefined;
    this.#mcpClient = undefined;
  }
}
