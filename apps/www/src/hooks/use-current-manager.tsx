import { createContext } from '@libs/ui-primitives';
import {
  type ClientServerStorageData,
  createMpcConductor,
  createMpcManager,
  type MpcConductor,
  type MpcManager,
  type MpcManagerStorage,
  type ServerStorageData,
} from '@openmcp/manager';
import type { QueryClient } from '@tanstack/react-query';
import { useLiveQuery } from 'dexie-react-hooks';
import { type ReactNode, useEffect, useRef } from 'react';

import type { LocalDb } from '~/utils/local-db.ts';
import { queryOptions } from '~/utils/query-options.ts';

import { useRootStore } from './use-root-store.tsx';

export const [CurrentManagerContext, useCurrentManager] = createContext<{
  manager: MpcManager;
  conductor: MpcConductor;
}>({
  name: 'CurrentManagerContext',
  strict: true,
});

export const CurrentManagerProvider = ({ children }: { children: ReactNode }) => {
  const { db, queryClient } = useRootStore();

  const manager = useRef(
    createMpcManager({
      storage: {
        servers: initServerStorage({ db, queryClient }),
        clientServers: initLocalClientServerStorage({ db }),
        threads: initLocalThreadStorage({ db }),
        threadMessages: initLocalThreadMessageStorage({ db }),
      },
    }),
  );

  // https://stackoverflow.com/a/73528448
  const [config, configLoaded] = useLiveQuery(
    () => db.mpcManagers.get('default').then(m => [m, true]),
    [], // deps...
    [], // default result: makes 'loaded' undefined while loading
  );

  const conductor = useRef(
    createMpcConductor({
      llmProxyUrl: ({ provider }) => `${import.meta.env.VITE_API_URL}/_/llm/${provider}`,
      toolsByClientId: manager.current.clientServers.toolsByClientId,
      settings: {
        providers: {
          openai: { apiKey: '' },
        },
      },
    }),
  );

  useEffect(() => {
    if (!configLoaded) return;

    if (!config) {
      void db.mpcManagers.add({ id: 'default' });
      return;
    }

    if (config.conductor) {
      void conductor.current.updateSettings(config.conductor);
    }
  }, [config, configLoaded, db.mpcManagers]);

  return (
    <CurrentManagerContext.Provider value={{ manager: manager.current, conductor: conductor.current }}>
      {children}
    </CurrentManagerContext.Provider>
  );
};

const initServerStorage = ({ db, queryClient }: { db: LocalDb; queryClient: QueryClient }) => {
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
      return queryClient.fetchQuery({
        ...queryOptions.directory(),
        queryFn: () => fetch(`${import.meta.env.VITE_API_URL}/directory`).then(res => res.json()),
      });
    },
    getById: async ({ id }) => {
      return queryClient.fetchQuery({
        ...queryOptions.directoryServer({ serverId: id }),
        queryFn: () => fetch(`${import.meta.env.VITE_API_URL}/directory/${id}`).then(res => res.json()),
      });
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
        res = await db.threads.where(where).sortBy('createdAt');
      } else {
        res = await db.threads.orderBy('createdAt').toArray();
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
