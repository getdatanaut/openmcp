import type {
  ClientServerStorageData,
  DefaultMpcConductorSettings,
  ServerStorageData,
  ThreadMessageStorageData,
  ThreadStorageData,
} from '@openmcp/manager';
import { Dexie, type EntityTable } from 'dexie';

export type LocalDb = typeof localDb;

export interface MpcManagerStorageData {
  id: string;
  // @TODO option to store manager configuration remotely, so can use outside of local clients (e.g. via api)
  isRemote?: boolean;
  conductor?: DefaultMpcConductorSettings;
}

const localDb = new Dexie('datanaut') as Dexie & {
  servers: EntityTable<ServerStorageData, 'id'>;
  clientServers: EntityTable<ClientServerStorageData, 'id'>;
  threads: EntityTable<ThreadStorageData, 'id'>;
  threadMessages: EntityTable<ThreadMessageStorageData, 'id'>;
  mpcManagers: EntityTable<MpcManagerStorageData, 'id'>;
};

// Primary key and indexed props only
localDb.version(1).stores({
  servers: 'id',
  clientServers: 'id, clientId, serverId',
  threads: 'id, clientId',
  threadMessages: 'id, threadId',
  mpcManagers: 'id',
});

export { localDb };
