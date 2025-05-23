import { Client as McpClient } from '@modelcontextprotocol/sdk/client/index.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { McpManager } from './manager.ts';
import { createTransport, type TransportConfig, type TransportConfigs } from './transport.ts';
import type { ServerId } from './types.ts';

/**
 * Manager
 */

export interface ServerManagerOptions {
  manager: {
    storage: Pick<McpManager['storage'], 'servers'>;
  };

  /**
   * Optional factory functions to create in memory MCP Servers.
   *
   * Only applicable to servers using the `inMemory` transport.
   *
   * Mostly useful for testing.
   */
  inMemoryServerFactories?: Record<ServerId, CreateMcpServerFactory>;
}

export function createServerManager(options: ServerManagerOptions) {
  return new ServerManager(options);
}

export class ServerManager {
  #servers = new Map<ServerId, Server>();
  #manager: ServerManagerOptions['manager'];
  #inMemoryServerFactories: Record<ServerId, CreateMcpServerFactory>;

  constructor(options: ServerManagerOptions) {
    this.#manager = options.manager;
    this.#inMemoryServerFactories = options.inMemoryServerFactories || {};
  }

  protected get storage() {
    return this.#manager.storage.servers;
  }

  public findMany = async (where?: Partial<ServerStorageData>) => {
    const servers = await this.storage.findMany(where);
    for (const server of servers) {
      if (!this.#servers.has(server.id)) {
        this.#servers.set(
          server.id,
          Server.deserialize(server, {
            manager: this.#manager,
            createServer: this.createInMemoryServer(server),
          }),
        );
      }
    }

    const found = Array.from(this.#servers.values());

    return where ? found.filter(item => Object.entries(where).every(([key, value]) => item[key] === value)) : found;
  };

  public get = async ({ id }: { id: ServerId }) => {
    let server = this.#servers.get(id);
    if (!server) {
      const stored = await this.storage.getById({ id });
      if (stored) {
        server = Server.deserialize(stored, {
          manager: this.#manager,
          createServer: this.createInMemoryServer(stored),
        });
        this.#servers.set(stored.id, server);
      }
    }
    return server;
  };

  public add = async (server: Server) => {
    await this.storage.insert(Server.serialize(server));
    this.#servers.set(server.id, server);
    return server;
  };

  public create = async (data: ServerStorageData) => {
    return this.add(
      createServer(data, {
        manager: this.#manager,
        createServer: this.createInMemoryServer(data),
      }),
    );
  };

  public delete = async ({ id }: { id: ServerId }) => {
    // @TODO probably should delete & close all client servers for this server
    await this.storage.delete({ id });
    this.#servers.delete(id);
  };

  private createInMemoryServer =
    (server: ServerStorageData): CreateMcpServerFactory =>
    input => {
      const factory = this.#inMemoryServerFactories[server.id];
      if (!factory && server.transport.type === 'inMemory') {
        throw new Error(`No createInMemoryServer factory found for inMemory server ${server.id}`);
      }

      return factory?.(input);
    };
}

/*
 * Instance
 */

export interface ServerStorageData {
  id: ServerId;
  name: string;
  version: string;

  /**
   * JSONSchema7 subset used to validate the configuration when a Client connects to the MCP Server.
   *
   * Can also be used by host apps to render a UI for the server configuration.
   *
   * @example
   * ```ts
   * configSchema: {
   *   properties: {
   *     apiKey: {
   *       type: 'string',
   *       title: 'API Key',
   *       description: 'The API key for the MCP Server',
   *       format: 'secret',
   *     },
   *   },
   *   required: ['apiKey'],
   * };
   * ```
   */
  configSchema?: {
    type?: 'object';

    properties: Record<
      string,
      {
        type: 'string' | 'number' | 'boolean';
        title?: string;
        description?: string;
        default?: string | number | boolean;
        enum?: string[];
        format?: 'secret' | string;
        example?: string | number | boolean;
      }
    >;

    required?: string[];
  };

  /**
   * Transport configuration for how the Client should connect to the underlying MCP Server.
   */
  transport: TransportConfig<keyof TransportConfigs>;

  /**
   * Optional information that can be helpful for presentational/ui purposes.
   */
  presentation?: {
    /** Description of the server - markdown allowed. */
    description?: string;

    category?: string;
    developer?: string;
    sourceUrl?: string;
    tags?: string[];
    icon?: {
      light: string;
      dark: string;
    };
  };
}

export interface ServerOptions<TC extends unknown = Record<string, unknown>> {
  manager: {
    storage: Pick<McpManager['storage'], 'servers'>;
  };

  /**
   * Optional factory function to create an in memory MCP Server.
   *
   * Only applicable when using the `inMemory` transport.
   */
  createServer?: CreateMcpServerFactory<TC>;
}

export type MinimalMcpServer = Pick<McpServer, 'connect' | 'server' | 'close'>;

export type CreateMcpServerFactory<C = Record<string, unknown>> = (
  config: C,
) => Promise<MinimalMcpServer> | MinimalMcpServer | undefined;

/**
 * Create a server configuration
 */
export function createServer(data: ServerStorageData, options: ServerOptions) {
  return new Server(data, options);
}

/**
 * A Server defines the `configSchema` and `capabilities` for an MCPServer.
 *
 * A Client will configure the MCP Server before connecting via the `transport`.
 */
export class Server<TC extends unknown = Record<string, unknown>, O extends ServerOptions<TC> = ServerOptions<TC>> {
  public readonly id: ServerId;
  public readonly name: ServerStorageData['name'];
  public readonly version: ServerStorageData['version'];
  public readonly configSchema: ServerStorageData['configSchema'];
  public readonly transport: ServerStorageData['transport'];
  public readonly presentation: ServerStorageData['presentation'];
  public readonly createServer?: CreateMcpServerFactory<TC>;

  #manager: ServerOptions['manager'];

  static deserialize<TC extends unknown, O extends ServerOptions<TC> = ServerOptions<TC>>(
    data: ServerStorageData,
    options: O,
  ): Server<TC, O> {
    return new Server(data, options);
  }

  static serialize<TC extends unknown, O extends ServerOptions<TC> = ServerOptions<TC>>(server: Server<TC, O>) {
    return {
      id: server.id,
      name: server.name,
      version: server.version,
      configSchema: server.configSchema,
      transport: server.transport,
      presentation: server.presentation,
    } satisfies ServerStorageData;
  }

  constructor(data: ServerStorageData, options: O) {
    this.id = data.id;
    this.name = data.name;
    this.version = data.version;
    this.configSchema = data.configSchema;
    this.transport = data.transport ?? { type: 'inMemory', config: {} };
    this.presentation = data.presentation;

    this.createServer = options.createServer;
    this.#manager = options.manager;
  }

  protected get storage() {
    return this.#manager.storage;
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
  public async callTool(toolConfig: { name: string; input: Record<string, unknown>; config: TC }) {
    const clientId = JSON.stringify(toolConfig);
    const mcpClient = new McpClient({
      name: `${this.id}-${clientId}`,
      version: this.version,
    });

    const { clientTransport, serverTransport } = await createTransport(this.transport.type, this.transport.config);

    /**
     * Connect the server and client via the same transport
     */
    const mcpServer = await this.createServer?.(toolConfig.config);
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
          await mcpServer.close();
        }
      });
  }
}
