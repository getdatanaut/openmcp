import { type ClientServerManager, type ClientServerStorageData, createClientServerManager } from './client-servers.ts';
import { createServerManager, type ServerManager, type ServerStorageData } from './servers.ts';
import type { Storage } from './storage/index.ts';
import { createMemoryStorage } from './storage/memory.ts';
import type { McpManagerId } from './types.ts';

export interface McpManagerOptions {
  /**
   * A unique identifier for this manager
   */
  id?: McpManagerId;

  /**
   * Optionally provide a Storage implementation to persist manager state
   *
   * @default MemoryStorage
   */
  storage?: Partial<McpManagerStorage>;
}

export interface McpManagerStorage {
  servers: Storage<ServerStorageData>;
  clientServers: Storage<ClientServerStorageData>;
}

export function createMcpManager(options?: McpManagerOptions) {
  return new McpManager(options);
}

/**
 * The McpManager maintains knowledge of registered servers,
 * connected clients, server<->client connections.
 */
export class McpManager {
  public readonly id: McpManagerId;
  public readonly servers: ServerManager;
  public readonly clientServers: ClientServerManager;
  public readonly storage: McpManagerStorage;

  constructor({ id, storage }: McpManagerOptions = {}) {
    this.id = id ?? 'no-id';
    this.storage = {
      servers: storage?.servers ?? createMemoryStorage<ServerStorageData>(),
      clientServers: storage?.clientServers ?? createMemoryStorage<ClientServerStorageData>(),
    };
    this.servers = createServerManager({ manager: this });
    this.clientServers = createClientServerManager({ manager: this });
  }

  public async close() {
    // @TODO close / dispose of any connections or other resources
    await this.clientServers.close();
  }
}
