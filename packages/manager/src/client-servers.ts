import { Client as McpClient } from '@modelcontextprotocol/sdk/client/index.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { MpcManager } from './manager.ts';
import { createTransport } from './transport.ts';
import type { ClientId, ServerId, ToolName } from './types.ts';

/**
 * Manager
 */

export interface ClientServerManagerOptions {
  manager: {
    servers: MpcManager['servers'];
    storage: {
      clientServers: MpcManager['storage']['clientServers'];
    };
  };
}

export function createClientServerManager(options: ClientServerManagerOptions) {
  return new ClientServerManager(options);
}

export class ClientServerManager {
  #manager: ClientServerManagerOptions['manager'];

  #clientServers = new Map<ClientServerId, ClientServer>();

  constructor(options: ClientServerManagerOptions) {
    this.#manager = options.manager;
  }

  protected get storage() {
    return this.#manager.storage.clientServers;
  }

  public findMany = async (where?: Partial<ClientServerStorageData>) => {
    const clientServers = await this.storage.findMany(where);
    for (const clientServer of clientServers) {
      if (!this.#clientServers.has(clientServer.id)) {
        this.#clientServers.set(clientServer.id, ClientServer.deserialize(clientServer, { manager: this.#manager }));
      }
    }

    const found = Array.from(this.#clientServers.values());

    return where ? found.filter(item => Object.entries(where).every(([key, value]) => item[key] === value)) : found;
  };

  public get = async ({ id }: { id: ClientServerId }) => {
    let clientServer = this.#clientServers.get(id);
    if (!clientServer) {
      const stored = await this.storage.getById({ id });
      if (stored) {
        clientServer = ClientServer.deserialize(stored, { manager: this.#manager });
        this.#clientServers.set(stored.id, clientServer);
      }
    }
    return clientServer;
  };

  public create = async (options: ClientServerStorageData) => {
    const server = createClientServer(options, { manager: this.#manager });
    await this.storage.insert(ClientServer.serialize(server));
    this.#clientServers.set(server.id, server);

    return server;
  };

  public delete = async ({ id }: { id: ClientServerId }) => {
    const clientServer = this.#clientServers.get(id);
    if (clientServer) {
      await clientServer.disconnect();
      await this.storage.delete({ id });
      this.#clientServers.delete(id);
    }
  };

  /**
   * List all tools available from the Servers configured for a given client.
   *
   * By default it will only return tools for connected client servers. Pass `lazyConnect: true` to connect
   * to all servers and return all tools.
   */
  public async toolsByClientId({ clientId, lazyConnect }: { clientId: ClientId; lazyConnect?: boolean }) {
    const clientServers = await this.findMany({ clientId });
    const tools = await Promise.all(clientServers.map(s => s.listTools({ lazyConnect })));
    return tools.flatMap(tools => tools || []);
  }

  /**
   * Disconnect from all MCP Servers for a given client.
   */
  public async disconnectClient({ clientId }: { clientId: ClientId }) {
    // Ok to grab from memory instead of storage, since any connected client servers will be in memory
    await Promise.all(Array.from(this.#clientServers.values()).map(server => server.disconnect()));
  }
}

/*
 * Instance
 */

export type ClientServerId = string | `${ClientId}-${ServerId}`;

export type ClientServerStorageData = {
  id: ClientServerId;
  clientId: ClientId;
  serverId: ServerId;
  serverConfig: Record<string, unknown>;
};

export interface ClientServerOptions {
  manager: Pick<MpcManager, 'servers'>;
}

interface ToolWithServer {
  name: string;
  description?: string;
  inputSchema: any;
  server: ServerId;
  execute: (input: Record<string, unknown>) => Promise<any>;
}

/**
 * Create a server configuration
 */
export function createClientServer(data: ClientServerStorageData, options: ClientServerOptions) {
  return new ClientServer(data, options);
}

export class ClientServer {
  public readonly id: ClientServerId;
  public readonly clientId: ClientId;
  public readonly serverId: ServerId;
  public readonly serverConfig: Record<string, unknown>;

  #manager: ClientServerOptions['manager'];
  #mcpClient?: McpClient;
  #mcpServer?: McpServer;

  static deserialize(data: ClientServerStorageData, options: ClientServerOptions): ClientServer {
    return new ClientServer(data, options);
  }

  static serialize(server: ClientServer) {
    return {
      id: server.id,
      clientId: server.clientId,
      serverId: server.serverId,
      serverConfig: server.serverConfig,
    } satisfies ClientServerStorageData;
  }

  constructor(data: ClientServerStorageData, options: ClientServerOptions) {
    this.id = data.id;
    this.clientId = data.clientId;
    this.serverId = data.serverId;
    this.serverConfig = data.serverConfig;
    this.#manager = options.manager;
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

    const server = await this.#manager.servers.get({ id: this.serverId });
    if (!server) {
      throw new Error(`Server "${this.serverId}" not found`);
    }

    /**
     * Create optional MCP Server defined by the server's config
     */
    const mcpServer = server.createServer?.(this.serverConfig);
    this.#mcpServer = mcpServer;

    /**
     * Create an MCP client to proxy requests to the MCP Server
     */
    const mcpClient = new McpClient({
      name: `${this.clientId}-${this.serverId}-proxy`,
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
  public async listTools({ lazyConnect = false }: { lazyConnect?: boolean } = {}): Promise<ToolWithServer[]> {
    if (!this.isConnected && !lazyConnect) {
      await this.connect();
    }

    if (!this.isConnected || !this.#mcpClient) {
      if (!lazyConnect) {
        return [];
      }

      await this.connect();

      return this.listTools();
    }

    const { tools } = await this.#mcpClient.listTools();

    return tools.map(tool => ({
      ...tool,
      server: this.serverId,
      execute: async (input: Record<string, unknown>) =>
        this.callTool({
          name: tool.name,
          input: input,
        }),
    }));
  }

  /**
   * Call a tool on the server
   */
  public async callTool(config: { name: ToolName; input: Record<string, unknown> }) {
    // Always lazy connect if not already connected and calling a specific tool
    if (!this.isConnected) {
      await this.connect();
    }

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
