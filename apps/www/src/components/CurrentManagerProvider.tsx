import { createMcpConductor, createMcpManager, type McpManagerStorage } from '@openmcp/manager';
import type { QueryClient } from '@tanstack/react-query';
import { useLiveQuery } from 'dexie-react-hooks';
import { type ReactNode, useEffect, useRef } from 'react';

import { CurrentManagerContext } from '~/hooks/use-current-manager.ts';
import { useRootStore } from '~/hooks/use-root-store.tsx';
import type { LocalClientServer, LocalDb } from '~/utils/local-db.ts';
import { queryOptions } from '~/utils/query-options.ts';

export const CurrentManagerProvider = ({ children }: { children: ReactNode }) => {
  const { db, queryClient } = useRootStore();

  const manager = useRef(
    createMcpManager({
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
    () => db.mcpManagers.get('default').then(m => [m, true]),
    [], // deps...
    [], // default result: makes 'loaded' undefined while loading
  );

  const conductor = useRef(
    createMcpConductor({
      llmProxyUrl: ({ provider }) => `${import.meta.env.VITE_API_URL}/_/llm/${provider}`,
      serversByClientId: manager.current.clientServers.serversByClientId,
      toolsByClientId: manager.current.clientServers.toolsByClientId,
      listClientServers: manager.current.clientServers.findMany,
      callTool: manager.current.clientServers.callTool,
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
      void db.mcpManagers.add({ id: 'default' });
      return;
    }

    if (config.conductor) {
      void conductor.current.updateSettings(config.conductor);
    }
  }, [config, configLoaded, db.mcpManagers]);

  return (
    <CurrentManagerContext.Provider value={{ manager: manager.current, conductor: conductor.current }}>
      {children}
    </CurrentManagerContext.Provider>
  );
};

const initServerStorage = ({ queryClient }: { db: LocalDb; queryClient: QueryClient }) => {
  return {
    insert: async () => {
      throw new Error('Not available in the local manager.');
    },
    upsert: async () => {
      throw new Error('Not available in the local manager.');
    },
    update: async () => {
      throw new Error('Not available in the local manager.');
    },
    delete: async () => {
      throw new Error('Not available in the local manager.');
    },
    findMany: async () => {
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
  } satisfies McpManagerStorage['servers'];
};

const initLocalClientServerStorage = ({ db }: { db: LocalDb }) => {
  return {
    insert: async row => {
      await db.clientServers.add({ ...row, enabled: row.enabled ? 1 : 0 });
    },
    upsert: async ({ id }, row) => {
      await db.clientServers.put({ ...row, id, enabled: row.enabled ? 1 : 0 });
    },
    update: async ({ id }, row) => {
      await db.clientServers.update(id, { ...row, enabled: row.enabled ? 1 : 0 });
    },
    delete: async ({ id }) => {
      await db.clientServers.delete(id);
    },
    findMany: async where => {
      let res: LocalClientServer[];
      if (where && Object.keys(where).length > 0) {
        res = await db.clientServers
          .where({ ...where, enabled: where.enabled === undefined ? undefined : where.enabled ? 1 : 0 })
          .toArray();
      } else {
        res = await db.clientServers.toArray();
      }
      return res.map(r => ({ ...r, enabled: r.enabled === 1 }));
    },
    getById: async ({ id }) => {
      const res = await db.clientServers.get(id);
      return res ? { ...res, enabled: res.enabled === 1 } : undefined;
    },
  } satisfies McpManagerStorage['clientServers'];
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
  } satisfies McpManagerStorage['threads'];
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
  } satisfies McpManagerStorage['threadMessages'];
};
