import type { ThreadMessageStorageData, ThreadStorageData } from '@openmcp/manager/threads';
import { Dexie, type EntityTable } from 'dexie';

export type LocalDb = typeof localDb;

const localDb = new Dexie('datanaut') as Dexie & {
  threads: EntityTable<
    ThreadStorageData,
    'id' // primary key "id" (for the typings only)
  >;
  threadMessages: EntityTable<
    ThreadMessageStorageData,
    'id' // primary key "id" (for the typings only)
  >;
};

// Primary key and indexed props only
localDb.version(1).stores({
  threads: '++id, clientId',
  threadMessages: '++id, threadId',
});

export { localDb };
