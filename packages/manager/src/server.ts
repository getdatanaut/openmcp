import { createHash } from 'node:crypto';

import { Client as McpClient } from '@modelcontextprotocol/sdk/client/index.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { z } from 'zod';

import type { ToolName } from './connection.ts';
import type { Manager } from './manager.ts';
import { createTransport, type TransportConfig, type TransportConfigs } from './transport.ts';

export type ServerId = string;

export interface ServerCapabilities {
  tools: {
    [name: ToolName]: {
      description?: string;
      inputSchema: z.AnyZodObject;
    };
  };

  // TODO(CL): add the rest of the server capabilities
  // prompts?: {};
  // resources?: {};
}

export interface ServerConfig {
  id: ServerId;
  name: string;
  version: string;

  /**
   * Schema used to validate the configuration when a Client connects to the MCP Server.
   *
   * @example
   * ```ts
   * configSchema: z.object({
   *   apiKey: z.string(),
   * });
   * ```
   */
  configSchema: z.AnyZodObject;

  /**
   * Capabilities of the MCP Server
   */
  capabilities?: Partial<ServerCapabilities>;

  /**
   * Transport configuration for how the Client should connect to the underlying MCP Server.
   */
  transport: TransportConfig<keyof TransportConfigs>;

  /**
   * Optionally, create an MCP Server whenever the Client tries to connect.
   *
   * If not provided, the Client will try to connect using the configured `transport`.
   *
   * If provided, the Manager will call `createServer(config).connect(transport)`
   * with the configured `transport` before creating the Client connection.
   *
   * This is useful when using the InMemoryTransport, or if you want to
   * control the lifecycle of the MCP Server.
   *
   * @param config - The configuration for the server provided by the Client
   * @returns An MCP Server instance
   */
  createServer?: (config: z.infer<ServerConfig['configSchema']>) => McpServer;
}

export interface ServerStorageData {
  servers: Pick<Server, 'id' | 'name' | 'version' | 'transport' | 'capabilities' | 'configSchema'>;
}

/**
 * Create a server configuration
 */
export function createServer(config: ServerConfig, manager: Manager) {
  return new Server(config, manager);
}

/**
 * A Server defines the `configSchema` and `capabilities` for an MCPServer.
 *
 * A Client will configure the MCP Server before connecting via the `transport`.
 */
export class Server {
  public readonly id: ServerId;
  public readonly name: string;
  public readonly version: string;
  public readonly configSchema: z.AnyZodObject;
  public readonly capabilities: ServerCapabilities;
  public readonly transport: TransportConfig<keyof TransportConfigs>;
  public readonly createServer: ServerConfig['createServer'];

  private readonly manager: Manager;

  constructor(config: ServerConfig, manager: Manager) {
    this.id = config.id;
    this.name = config.name;
    this.version = config.version;
    this.configSchema = config.configSchema;
    this.capabilities = {
      ...config.capabilities,
      tools: config.capabilities?.tools ?? {},
    };
    this.transport = config.transport ?? { type: 'inMemory', config: {} };
    this.createServer = config.createServer;

    this.manager = manager;
  }

  /**
   * Get the storage from the manager
   */
  protected get storage() {
    return this.manager.storage;
  }

  /**
   * List available tools defined by the MCP Server.
   */
  public async listTools(): Promise<
    {
      server: ServerId;
      name: ToolName;
      description?: string;
      inputSchema: z.AnyZodObject;
    }[]
  > {
    return Object.entries(this.capabilities.tools ?? {}).map(([name, tool]) => {
      return { ...tool, name, server: this.id };
    });
  }

  /**
   * Get a tool defined by the MCP Server.
   */
  public async getTool(name: ToolName) {
    return this.capabilities.tools?.[name];
  }

  /**
   * Call a tool defined by the MCP Server.
   *
   * This method creates a connection to the MCP server, calls the tool, and then closes the connection.
   *
   * @param toolConfig.name - The name of the tool to call
   * @param toolConfig.input - The input to the tool
   * @param toolConfig.config - The configuration for the MCP Server
   * @returns The result of the tool call
   */
  public async callTool<T extends keyof ServerCapabilities['tools']>(toolConfig: {
    name: T;
    input: z.infer<ServerCapabilities['tools'][T]['inputSchema']>;
    config: z.infer<ServerConfig['configSchema']>;
  }) {
    const clientId = createHash('sha256').update(JSON.stringify(toolConfig)).digest('hex');
    const mcpClient = new McpClient({
      name: `${this.id}-${toolConfig.name}-${clientId}`,
      version: this.version,
    });

    const { clientTransport, serverTransport } = createTransport(this.transport.type, this.transport.config);

    /**
     * Connect the server and client via the same transport
     */
    const mcpServer = this.createServer?.(toolConfig.config);
    if (mcpServer) {
      await mcpServer.connect(serverTransport);
    }

    await mcpClient.connect(clientTransport);

    return mcpClient
      .callTool({
        name: String(toolConfig.name),
        arguments: toolConfig.input,
      })
      .finally(async () => {
        /**
         * Close the connections regardless of whether the tool call succeeds or fails
         */
        await mcpClient.close();

        if (mcpServer) {
          await mcpServer?.close();
        }
      });
  }

  /**
   * List all Clients that have configured this MCP Server.
   */
  public listClients() {
    return this.manager.listClients().filter(client => client.serverConnections.has(this.id));
  }
}
