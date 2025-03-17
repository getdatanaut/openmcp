import {
  type ClientServerStorageData,
  createMpcManager,
  defaultMpcConductorFactory,
  type DefaultMpcConductorSettings,
  type MpcManager,
  type MpcManagerId,
  type MpcManagerStorage,
  type Storage,
} from '@openmcp/manager';
import { makeAutoObservable } from 'mobx';

import { type LocalDb, type MpcManagerStorageData } from '~/utils/local-db.ts';
import { generateMockServers } from '~/utils/mocks.ts';

export class McpManagersStore {
  public managers: Record<MpcManagerId, MpcManager> = {};

  #localDb: LocalDb;
  #mcpManagersStorage: Storage<MpcManagerStorageData>;

  constructor({ localDb }: { localDb: LocalDb }) {
    makeAutoObservable(this);

    this.#localDb = localDb;
    this.#mcpManagersStorage = initLocalMpcManagerStorage({ db: localDb });
  }

  public add({ id, conductor }: { id: string; conductor?: DefaultMpcConductorSettings }) {
    const m = createMpcManager({
      id,
      conductor: defaultMpcConductorFactory({
        llmProxyUrl: ({ provider }) => `${import.meta.env.VITE_LLM_PROXY_URL}/${provider}`,
        settings: conductor,
      }),
      storage: {
        servers: initServerStorage({ db: this.#localDb }),
        clientServers: initLocalClientServerStorage({ db: this.#localDb }),
        threads: initLocalThreadStorage({ db: this.#localDb }),
        threadMessages: initLocalThreadMessageStorage({ db: this.#localDb }),
      },
    });

    this.managers[id] = m;

    return m;
  }

  // async ok (vs flow) because we're not updating any local state
  public async insert({ id, conductor }: { id: string; conductor?: DefaultMpcConductorSettings }) {
    await this.#mcpManagersStorage.insert({ id, conductor });
  }
}

const initServerStorage = ({ db }: { db: LocalDb }) => {
  return {
    insert: async row => {
      throw new Error('Not available in the local manager.');
    },
    upsert: async ({ id }, row) => {
      throw new Error('Not available in the local manager.');
    },
    update: async ({ id }, row) => {
      throw new Error('Not available in the local manager.');
    },
    delete: async ({ id }) => {
      throw new Error('Not available in the local manager.');
    },
    findMany: async where => {
      return generateMockServers();
    },
    getById: async ({ id }) => {
      return generateMockServers().find(server => server.id === id);
    },
  } satisfies MpcManagerStorage['servers'];
};

const initLocalClientServerStorage = ({ db }: { db: LocalDb }) => {
  return {
    insert: async row => {
      await db.clientServers.add(row);
    },
    upsert: async ({ id }, row) => {
      await db.clientServers.put({ ...row, id });
    },
    update: async ({ id }, row) => {
      await db.clientServers.update(id, row);
    },
    delete: async ({ id }) => {
      await db.clientServers.delete(id);
    },
    findMany: async where => {
      let res: ClientServerStorageData[];
      if (where && Object.keys(where).length > 0) {
        res = await db.clientServers.where(where).toArray();
      } else {
        res = await db.clientServers.toArray();
      }
      return res;
    },
    getById: async ({ id }) => {
      const res = await db.clientServers.get(id);
      return res;
    },
  } satisfies MpcManagerStorage['clientServers'];
};

const initLocalThreadStorage = ({ db }: { db: LocalDb }) => {
  return {
    insert: async row => {
      await db.threads.add(row);
    },
    upsert: async ({ id }, row) => {
      await db.threads.put({ ...row, id });
    },
    update: async ({ id }, row) => {
      await db.threads.update(id, row);
    },
    delete: async ({ id }) => {
      await db.transaction('rw', db.threads, db.threadMessages, async () => {
        await db.threads.delete(id);
        await db.threadMessages.where('threadId').equals(id).delete();
      });
    },
    findMany: async where => {
      let res;
      if (where && Object.keys(where).length > 0) {
        res = await db.threads.where(where).toArray();
      } else {
        res = await db.threads.toArray();
      }
      return res;
    },
    getById: async ({ id }) => {
      const res = await db.threads.get(id);
      return res;
    },
  } satisfies MpcManagerStorage['threads'];
};

const initLocalThreadMessageStorage = ({ db }: { db: LocalDb }) => {
  return {
    insert: async row => {
      await db.threadMessages.add(row);
    },
    upsert: async ({ id }, row) => {
      await db.threadMessages.put({ ...row, id });
    },
    update: async ({ id }, row) => {
      await db.threadMessages.update(id, row);
    },
    delete: async ({ id }) => {
      await db.threadMessages.delete(id);
    },
    findMany: async where => {
      let res;
      if (where && Object.keys(where).length > 0) {
        res = await db.threadMessages.where(where).toArray();
      } else {
        res = await db.threadMessages.toArray();
      }
      return res;
    },
    getById: async ({ id }) => {
      const res = await db.threadMessages.get(id);
      return res;
    },
  } satisfies MpcManagerStorage['threadMessages'];
};

const initLocalMpcManagerStorage = ({ db }: { db: LocalDb }) => {
  return {
    insert: async row => {
      await db.mpcManagers.add(row);
    },
    upsert: async ({ id }, row) => {
      await db.mpcManagers.put({ ...row, id });
    },
    update: async ({ id }, row) => {
      await db.mpcManagers.update(id, row);
    },
    delete: async ({ id }) => {
      await db.mpcManagers.delete(id);
    },
    findMany: async where => {
      let res;
      if (where && Object.keys(where).length > 0) {
        res = await db.mpcManagers.where(where).toArray();
      } else {
        res = await db.mpcManagers.toArray();
      }
      return res;
    },
    getById: async ({ id }) => {
      const res = await db.mpcManagers.get(id);
      return res;
    },
  } satisfies Storage<MpcManagerStorageData>;
};
