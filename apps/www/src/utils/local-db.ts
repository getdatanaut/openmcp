import type { DefaultMpcConductorSettings } from '@openmcp/manager';
import type { ThreadMessageStorageData, ThreadStorageData } from '@openmcp/manager/threads';
import { Dexie, type EntityTable } from 'dexie';

export type LocalDb = typeof localDb;

export interface ManagerStorageData {
  id: string;
  // @TODO option to store manager configuration remotely, so can use outside of local clients (e.g. via api)
  isRemote?: boolean;
  conductor?: DefaultMpcConductorSettings;
}

const localDb = new Dexie('datanaut') as Dexie & {
  threads: EntityTable<
    ThreadStorageData,
    'id' // primary key "id" (for the typings only)
  >;
  threadMessages: EntityTable<
    ThreadMessageStorageData,
    'id' // primary key "id" (for the typings only)
  >;
  mpcManagers: EntityTable<
    ManagerStorageData,
    'id' // primary key "id" (for the typings only)
  >;
};

// Primary key and indexed props only
localDb.version(1).stores({
  threads: '++id, clientId',
  threadMessages: '++id, threadId',
  mpcManagers: '++id',
});

export { localDb };
