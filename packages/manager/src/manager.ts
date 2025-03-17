import { type ClientServerManager, type ClientServerStorageData, createClientServerManager } from './client-servers.ts';
import type { MpcConductor, MpcConductorFactory } from './conductor/adapter.ts';
import { defaultMpcConductorFactory } from './conductor/default.ts';
import { createServerManager, type ServerManager, type ServerStorageData } from './servers.ts';
import type { Storage } from './storage/index.ts';
import { createMemoryStorage } from './storage/memory.ts';
import {
  createThreadManager,
  type ThreadManager,
  type ThreadMessageStorageData,
  type ThreadStorageData,
} from './threads.ts';
import type { MpcManagerId } from './types.ts';

export interface MpcManagerOptions {
  /**
   * A unique identifier for this manager
   */
  id?: MpcManagerId;

  /**
   * Optionally provide a Storage implementation to persist manager state
   *
   * @default MemoryStorage
   */
  storage?: Partial<MpcManagerStorage>;

  /**
   * Optionally provide a Conductor implementation to handle tool orchestration
   */
  conductor?: MpcConductorFactory;
}

export interface MpcManagerStorage {
  servers: Storage<ServerStorageData>;
  clientServers: Storage<ClientServerStorageData>;
  threads: Storage<ThreadStorageData>;
  threadMessages: Storage<ThreadMessageStorageData>;
}

/**
 * Creates new Manager instance.
 */
export function createMpcManager(options?: MpcManagerOptions) {
  return new MpcManager(options);
}

/**
 * The MpcManager maintains knowledge of registered servers,
 * connected clients, server<->client connections, thread, and messages.
 */
export class MpcManager {
  public readonly id: MpcManagerId;
  public readonly servers: ServerManager;
  public readonly clientServers: ClientServerManager;
  public readonly threads: ThreadManager;
  public readonly storage: MpcManagerStorage;
  public readonly conductor: MpcConductor;

  constructor({ id, storage, conductor }: MpcManagerOptions = {}) {
    this.id = id ?? 'no-id';
    this.storage = {
      servers: storage?.servers ?? createMemoryStorage<ServerStorageData>(),
      clientServers: storage?.clientServers ?? createMemoryStorage<ClientServerStorageData>(),
      threads: storage?.threads ?? createMemoryStorage<ThreadStorageData>(),
      threadMessages: storage?.threadMessages ?? createMemoryStorage<ThreadMessageStorageData>(),
    };
    this.servers = createServerManager({ manager: this });
    this.clientServers = createClientServerManager({ manager: this });
    this.threads = createThreadManager({ manager: this });
    this.conductor = conductor ? conductor(this) : defaultMpcConductorFactory({})(this);
  }

  public async close() {
    // @TODO close / dispose of any connections or other resources
  }
}
