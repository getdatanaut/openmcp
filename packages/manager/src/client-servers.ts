import { Client as McpClient } from '@modelcontextprotocol/sdk/client/index.js';
import type { SetOptional } from 'type-fest';

import type { McpManager } from './manager.ts';
import type { MinimalMcpServer } from './servers.ts';
import { createTransport } from './transport.ts';
import type { ClientId, ServerId, ToolName } from './types.ts';

/**
 * Manager
 */
export interface ClientServerManagerOptions {
  manager: {
    servers: McpManager['servers'];
    storage: {
      clientServers: McpManager['storage']['clientServers'];
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

  #getFromStorage = async ({ id }: { id: ClientServerId }) => {
    const stored = await this.storage.getById({ id });
    if (!stored) return undefined;

    const clientServer = ClientServer.deserialize(stored, { manager: this.#manager });
    // Sync to in-memory cache
    this.#clientServers.set(stored.id, clientServer);
    return clientServer;
  };

  public get = async ({ id }: { id: ClientServerId }) => {
    let clientServer = this.#clientServers.get(id);
    if (!clientServer) {
      clientServer = await this.#getFromStorage({ id });
    }
    return clientServer;
  };

  public create = async (options: SetOptional<ClientServerStorageData, 'id'>) => {
    const clientServer = createClientServer(
      { id: `${options.clientId}-${options.serverId}`, ...options },
      { manager: this.#manager },
    );
    return this.add(clientServer);
  };

  public add = async (clientServer: ClientServer) => {
    await this.storage.insert(ClientServer.serialize(clientServer));
    this.#clientServers.set(clientServer.id, clientServer);
    return clientServer;
  };

  public update = async ({ id }: { id: ClientServerId }, options: Partial<ClientServerStorageData>) => {
    const existing = await this.get({ id });
    if (!existing) {
      throw new Error(`Client server "${id}" not found`);
    }

    await this.storage.update({ id }, options);
    return this.#getFromStorage({ id });
  };

  public delete = async ({ id }: { id: ClientServerId }) => {
    const clientServer = this.#clientServers.get(id);
    if (clientServer) {
      await clientServer.disconnect();
      await this.storage.delete({ id });
      this.#clientServers.delete(id);
    }
  };

  /** Retrieve all servers that are configured for a given client. */
  public serversByClientId = async ({ clientId }: { clientId: ClientId }) => {
    const clientServers = await this.findMany({ clientId, enabled: true });
    return (await this.#manager.servers.findMany()).filter(server =>
      clientServers.some(clientServer => clientServer.serverId === server.id),
    );
  };

  /**
   * List all tools available from the Servers configured for a given client.
   *
   * By default it will only return tools for connected client servers. Pass `lazyConnect: true` to connect
   * to all servers and return all tools.
   */
  public toolsByClientId = async ({
    clientId,
    lazyConnect,
  }: {
    clientId: ClientId;
    lazyConnect?: boolean;
  }): Promise<Tool[]> => {
    const clientServers = await this.findMany({ clientId, enabled: true });
    const tools = await Promise.all(clientServers.map(s => s.listTools({ lazyConnect })));
    return tools.flatMap(tools => tools || []);
  };

  public callTool = async (config: {
    clientId: ClientId;
    serverId: ServerId;
    name: ToolName;
    input: Record<string, unknown> | undefined;
  }) => {
    const clientServers = await this.findMany({ clientId: config.clientId, serverId: config.serverId });
    const clientServer = clientServers[0];

    if (!clientServer) {
      throw new Error(`Client server not found for client ${config.clientId} and server ${config.serverId}`);
    }

    return clientServer?.callTool({ name: config.name, input: config.input });
  };

  /**
   * Disconnect from all MCP Servers for a given client.
   */
  public async disconnectClient({ clientId }: { clientId: ClientId }) {
    const clientServers = await this.findMany({ clientId });
    // Ok to grab from memory instead of storage, since any connected client servers will be in memory
    await Promise.all(clientServers.map(server => server.disconnect()));
  }

  public async close() {
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
  enabled?: boolean;
};

export interface ClientServerOptions {
  manager: Pick<McpManager, 'servers'>;
}

export interface Tool {
  server: ServerId;
  name: string;
  description?: string;
  inputSchema: any;
  outputSchema: any;
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
  public readonly enabled: boolean = true;

  #manager: ClientServerOptions['manager'];
  #mcpClient?: McpClient;
  #mcpServer?: MinimalMcpServer;

  static deserialize(data: ClientServerStorageData, options: ClientServerOptions): ClientServer {
    return new ClientServer(data, options);
  }

  static serialize(server: ClientServer) {
    return {
      id: server.id,
      clientId: server.clientId,
      serverId: server.serverId,
      serverConfig: server.serverConfig,
      enabled: server.enabled ?? true, // Default enabled
    } satisfies ClientServerStorageData;
  }

  constructor(data: ClientServerStorageData, options: ClientServerOptions) {
    this.id = data.id;
    this.clientId = data.clientId;
    this.serverId = data.serverId;
    this.serverConfig = data.serverConfig;
    this.enabled = data.enabled ?? true;
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
    const mcpServer = await server.createServer?.(this.serverConfig);
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
    const { clientTransport, serverTransport } = await createTransport(
      server.transport.type,
      replaceVariables(server.transport.config, this.serverConfig),
    );

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
  public async listTools({ lazyConnect = false }: { lazyConnect?: boolean } = {}): Promise<Tool[]> {
    if (!this.isConnected) {
      if (lazyConnect) {
        await this.connect();
      }
    }

    if (!this.isConnected || !this.#mcpClient) {
      return [];
    }

    const { tools } = await this.#mcpClient.listTools();

    return tools.map(tool => ({
      server: this.serverId,
      name: tool.name,
      description: tool.description,
      inputSchema: tool['inputSchema'],
      outputSchema: tool['outputSchema'],
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
  public async callTool(config: { name: ToolName; input: Record<string, unknown> | undefined }) {
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
   * Set a notification handler for the server.
   * Wraps the MCP Client's setNotificationHandler method.
   */
  public setNotificationHandler(...args: Parameters<McpClient['setNotificationHandler']>) {
    if (!this.isConnected || !this.#mcpClient) {
      throw new Error('MCP Client is not connected');
    }

    this.#mcpClient.setNotificationHandler(...args);
  }

  /**
   * Remove a notification handler for the server.
   * @param args
   */
  public removeNotificationHandler(...args: Parameters<McpClient['removeNotificationHandler']>) {
    if (!this.isConnected || !this.#mcpClient) {
      throw new Error('MCP Client is not connected');
    }

    this.#mcpClient.removeNotificationHandler(...args);
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

function replaceVariables<T = Record<string, unknown>>(config: T, variables: Record<string, any>): T {
  return JSON.parse(JSON.stringify(config).replace(/\{\{([^}]+)\}\}/g, (match, p1) => variables[p1] || match)) as T;
}
