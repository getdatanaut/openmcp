import type { TransportConfigs } from './transport.ts';
import { Server, type ServerConfig } from './server.ts';
import { Client, type ClientConfig } from './client.ts';

type ServerId = string;
type ClientId = string;

export interface ManagerOptions {
  /**
   * A unique identifier for this manager
   */
  id: string;

  /**
   * Transports available for clients to connect to this manager
   *
   * @default InMemoryTransport
   */
  transports?: Partial<TransportConfigs>;

  /**
   * Optionally register servers during manager creation.
   *
   * This is equivalent to calling `manager.registerServer()` for each server.
   */
  servers?: {
    [id: ServerId]: Omit<ServerConfig, 'id'>;
  };
}

/**
 * Create a new manager instance.
 */
export function createManager(options: ManagerOptions) {
  return new Manager(options);
}

/**
 * The Manager maintains knowledge of registered servers,
 * connected clients, and server<->client connections.
 */
export class Manager {
  public readonly id: string;
  public readonly transports: ManagerOptions['transports'];
  public readonly servers = new Map<ServerId, Server>();
  public readonly clients = new Map<ClientId, Client>();

  constructor(options: ManagerOptions) {
    this.id = options.id;
    this.transports = options.transports ?? { inMemory: {} };

    if (options.servers) {
      Object.entries(options.servers).forEach(([serverId, server]) => {
        this.registerServer({
          ...server,
          id: serverId,
        });
      });
    }
  }

  /**
   * Register an MCP Server to allow clients connections to it.
   *
   * This method does not create a connection to the Server.
   *
   * Clients can configure the server using `manager.registerClient(clientConfig)` or `client.configureServer(config)` methods.
   *
   * Clients can connect to the server using `manager.connectClient(clientConfig)` or `client.connectServer(config)` methods.
   */
  public registerServer(serverConfig: ServerConfig) {
    const server = new Server(serverConfig, this);
    this.servers.set(serverConfig.id, server);

    return server;
  }

  /**
   * Register a Client, and optionally configure MCP Servers for it.
   *
   * This method does not create a connection to the Server.
   *
   * Connect to Servers using `manager.connectClient(clientConfig)` or `client.connectServer(serverId, config)`
   */
  public registerClient(clientConfig: ClientConfig) {
    const client = new Client(clientConfig, this);
    this.clients.set(clientConfig.id, client);

    // Configure MCP Servers using the client's config
    if (clientConfig.servers) {
      for (const [serverId, userConfig] of Object.entries(clientConfig.servers)) {
        client.configureServer(serverId, userConfig);
      }
    }

    return client;
  }

  /**
   * Connect a Client, and optionally connect MCP Servers for it.
   */
  public async connectClient(clientConfig: ClientConfig) {
    const client = this.registerClient(clientConfig);

    // Connect to MCP Servers using the client's config
    if (clientConfig.servers) {
      for (const [serverId, userConfig] of Object.entries(clientConfig.servers)) {
        await client.connectServer(serverId, userConfig);
      }
    }

    return client;
  }

  /**
   * List all registered servers.
   */
  public listServers() {
    return Array.from(this.servers.values());
  }

  /**
   * Get a server by id.
   */
  public getServer(id: ServerId) {
    return this.servers.get(id);
  }

  /**
   * List all registered clients.
   */
  public listClients() {
    return Array.from(this.clients.values());
  }

  /**
   * Get a client by id.
   */
  public getClient(id: ClientId) {
    return this.clients.get(id);
  }

  /**
   * Get available tools defined by registered Servers.
   *
   * If `options.servers` is provided, only tools from the specified servers will be returned.
   */
  public async listTools(options?: { servers?: ServerId[] }) {
    const toolPromises = this.listServers().map(async server => {
      if (options?.servers && !options.servers.includes(server.id)) {
        return [];
      }

      return server.listTools();
    });

    const tools = await Promise.all(toolPromises);
    return tools.flat();
  }
}
