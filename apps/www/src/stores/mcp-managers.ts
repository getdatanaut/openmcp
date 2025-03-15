import {
  createManager,
  defaultMpcConductorFactory,
  type DefaultMpcConductorSettings,
  type Manager,
  type ManagerId,
  type ManagerStorage,
  type Storage,
} from '@openmcp/manager';
import { makeAutoObservable } from 'mobx';
import { z } from 'zod';

import { type LocalDb, type ManagerStorageData } from '~/utils/local-db.ts';

export class McpManagersStore {
  public managers: Record<ManagerId, Manager> = {};

  #localDb: LocalDb;
  #mcpManagersStorage: Storage<ManagerStorageData>;

  constructor({ localDb }: { localDb: LocalDb }) {
    makeAutoObservable(this);

    this.#localDb = localDb;
    this.#mcpManagersStorage = initLocalMpcManagerStorage({ db: localDb });
  }

  public create({ id, conductor }: { id: string; conductor?: DefaultMpcConductorSettings }) {
    const m = createManager({
      id,
      conductor: defaultMpcConductorFactory({
        llmProxyUrl: ({ provider }) => `${import.meta.env.VITE_LLM_PROXY_URL}/${provider}`,
        settings: conductor,
      }),
      storage: {
        threads: initLocalThreadStorage({ db: this.#localDb }),
        threadMessages: initLocalThreadMessageStorage({ db: this.#localDb }),
      },
    });

    m.registerServer({
      id: 'petstore',
      name: 'Petstore',
      version: '1.0.0',
      transport: {
        type: 'sse',
        config: {
          url: 'http://localhost:8787/mcp/openapi/sse?openapi=https://petstore3.swagger.io/api/v3/openapi.json&baseUrl=https://petstore3.swagger.io/api/v3',
        },
      },
      configSchema: z.object({}),
    });

    const client = m.registerClient({
      id: 'anonClientId',
      servers: {
        petstore: {},
      },
    });

    void client.connectServer('petstore');

    return m;
  }

  // async ok (vs flow) because we're not updating any local state
  public async insert({ id, conductor }: { id: string; conductor?: DefaultMpcConductorSettings }) {
    await this.#mcpManagersStorage.insert({ id, conductor });
  }
}

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
    // @TODO update to list, or findMany/findOne
    select: async where => {
      const res = await db.threads.where(where || {}).toArray();
      return res;
    },
    // @TODO update to get
    getById: async ({ id }) => {
      const res = await db.threads.get(id);
      return res;
    },
  } satisfies ManagerStorage['threads'];
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
    select: async where => {
      const res = await db.threadMessages.where(where || {}).toArray();
      return res;
    },
    getById: async ({ id }) => {
      const res = await db.threadMessages.get(id);
      return res;
    },
  } satisfies ManagerStorage['threadMessages'];
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
    select: async where => {
      const res = await db.mpcManagers.where(where || {}).toArray();
      return res;
    },
    getById: async ({ id }) => {
      const res = await db.mpcManagers.get(id);
      return res;
    },
  } satisfies Storage<ManagerStorageData>;
};
