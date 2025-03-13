import type { z } from 'zod';

import { Connection, type ToolName } from './connection.ts';
import type { Manager } from './manager.ts';
import type { ServerConfig, ServerId } from './server.ts';
import type { TransportConfig, TransportConfigs } from './transport.ts';

export type ClientId = string;

export interface ClientConfig {
  id: ClientId;

  /**
   * Transport used to connect to the Manager.
   */
  transport?: TransportConfig<keyof TransportConfigs>;

  servers?: {
    [id: ServerId]: z.infer<ServerConfig['configSchema']>;
  };
}

/**
 * A Client configures and manages connections to MCP Servers.
 */
export class Client {
  public readonly id: ClientId;
  public readonly transport: ClientConfig['transport'];
  public readonly serverConnections = new Map<ServerId, Connection>();

  private readonly manager: Manager;

  constructor(config: ClientConfig, manager: Manager) {
    this.id = config.id;
    this.transport = config.transport ?? { type: 'inMemory', config: {} };
    this.manager = manager;
  }

  /**
   * Get the storage from the manager
   */
  protected get storage() {
    return this.manager.storage;
  }

  /**
   * Configure an MCP Server to be used by this Client.
   *
   * This method does not create a connection to the server.
   *
   * To connect to the server, call `connect()` on the returned connection,
   * or call `client.connectServer(config)`.
   */
  public configureServer(serverId: ServerId, config: z.infer<ServerConfig['configSchema']>) {
    const connection = new Connection(
      {
        clientId: this.id,
        serverId,
        config,
      },
      this.manager,
    );

    this.serverConnections.set(serverId, connection);

    return connection;
  }

  /**
   * Connect to a MCP Server.
   *
   * Optionally, provide a `config` to configure the MCP Server before connecting.
   *
   * This method will throw an error if the Server has not been configured and no `config` is provided.
   */
  public async connectServer(serverId: ServerId, config?: z.infer<ServerConfig['configSchema']>) {
    const connection = config ? this.configureServer(serverId, config) : this.serverConnections.get(serverId);

    if (!connection) {
      throw new Error(
        `Server "${serverId}" has not been configured. Use "client.configureServer(config)" to configure the server.`,
      );
    }

    return connection.connect();
  }

  /**
   * List all Servers configured by this Client.
   */
  public listServers() {
    return Array.from(this.serverConnections.values());
  }

  /**
   * Get a Server configured by this Client.
   */
  public getServer(id: ServerId) {
    return this.serverConnections.get(id);
  }

  /**
   * List all tools available from Servers configured by this Client.
   */
  public async listTools() {
    const serverConnections = this.listServers();

    const tools = await Promise.all(serverConnections.map(server => server.listTools()));
    return tools.flatMap(tools => {
      if (!tools) return [];

      return tools.map(tool => ({
        ...tool,
        server: tool.server,
      }));
    });
  }

  /**
   * Call a tool defined by a connected MCP Server.
   *
   * If no `serverId` is provided, the first connected server with a matching tool name will be called.
   */
  public async callTool(config: { name: ToolName; input: z.infer<z.AnyZodObject>; serverId?: ServerId }) {
    if (config.serverId) {
      const server = this.getServer(config.serverId);
      if (!server) {
        throw new Error(`Server "${config.serverId}" not found`);
      }

      return server.callTool(config);
    }

    const tools = await this.listTools();

    const tool = tools.find(tool => tool.name === config.name);
    if (!tool) {
      throw new Error(`Tool "${config.name}" not found`);
    }
    const server = this.getServer(tool.server);
    if (!server) {
      throw new Error(`Server "${tool.server}" not found`);
    }

    return server.callTool(config);
  }

  /**
   * Disconnect from all MCP Servers.
   */
  public async disconnect() {
    await Promise.all(Array.from(this.serverConnections.values()).map(server => server.disconnect()));
  }
}
