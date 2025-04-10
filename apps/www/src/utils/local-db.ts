import type {
  ClientServerStorageData,
  McpConductorSettings,
  ServerStorageData,
  ThreadMessageStorageData,
  ThreadStorageData,
} from '@openmcp/manager';
import { Dexie, type EntityTable } from 'dexie';

// indexdb does not deal with booleans well
export type LocalClientServer = Omit<ClientServerStorageData, 'enabled'> & { enabled: number };

export interface LocalDb extends Dexie {
  servers: EntityTable<ServerStorageData, 'id'>;
  clientServers: EntityTable<LocalClientServer, 'id'>;
  mcpManagers: EntityTable<McpManagerStorageData, 'id'>;
  threads: EntityTable<ThreadStorageData, 'id'>;
  threadMessages: EntityTable<ThreadMessageStorageData, 'id'>;
}

export interface McpManagerStorageData {
  id: string;
  conductor?: McpConductorSettings;
}

const localDb = new Dexie('datanaut') as LocalDb;

// Primary key and indexed props only
localDb.version(1).stores({
  servers: 'id',
  clientServers: 'id, serverId, [clientId+enabled]',
  threads: 'id, clientId, createdAt',
  threadMessages: 'id, threadId, createdAt',
  mcpManagers: 'id',
});

export { localDb };
