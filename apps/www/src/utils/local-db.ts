import type {
  ClientServerStorageData,
  MpcConductorSettings,
  ServerStorageData,
  ThreadMessageStorageData,
  ThreadStorageData,
} from '@openmcp/manager';
import { Dexie, type EntityTable } from 'dexie';

export type LocalDb = typeof localDb;

export interface MpcManagerStorageData {
  id: string;
  conductor?: MpcConductorSettings;
}

const localDb = new Dexie('datanaut') as Dexie & {
  servers: EntityTable<ServerStorageData, 'id'>;
  clientServers: EntityTable<ClientServerStorageData, 'id'>;
  mpcManagers: EntityTable<MpcManagerStorageData, 'id'>;
  threads: EntityTable<ThreadStorageData, 'id'>;
  threadMessages: EntityTable<ThreadMessageStorageData, 'id'>;
};

// Primary key and indexed props only
localDb.version(1).stores({
  servers: 'id',
  clientServers: 'id, clientId, serverId',
  threads: 'id, clientId, createdAt',
  threadMessages: 'id, threadId, createdAt',
  mpcManagers: 'id',
});

export { localDb };
