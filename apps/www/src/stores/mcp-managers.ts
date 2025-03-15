import { createManager, type Manager, type ManagerId, type ManagerStorage } from '@openmcp/manager';
import { makeAutoObservable } from 'mobx';
import { z } from 'zod';

import { type LocalDb } from '~/utils/local-db.ts';

export class McpManagersStore {
  public managers: Record<ManagerId, Manager> = {};

  constructor({ localDb }: { localDb: LocalDb }) {
    makeAutoObservable(this);

    // Just creating one manager always, for now
    const m = createManager({
      id: 'default',
      storage: {
        threads: initLocalThreadStorage({ db: localDb }),
        threadMessages: initLocalThreadMessageStorage({ db: localDb }),
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

    this.managers['default'] = m;
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
    select: async where => {
      const res = await db.threads.where(where || {}).toArray();
      return res;
    },
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
