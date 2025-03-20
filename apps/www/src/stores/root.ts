import type { QueryClient } from '@tanstack/react-query';

import type { LocalDb } from '~/utils/local-db.ts';

import { AppStore } from './app.ts';
import { McpManagersStore } from './mcp-managers.ts';

export function createRootStore({ localDb, queryClient }: { localDb: LocalDb; queryClient: QueryClient }): RootStore {
  const rootStore = new RootStore({ localDb, queryClient });

  if (import.meta.env.DEV && typeof window !== 'undefined') {
    // @ts-expect-error ignore
    window.__ROOT_STORE__ = rootStore;
  }

  return rootStore;
}

export class RootStore {
  public readonly app = new AppStore();
  public readonly mcpManagers: McpManagersStore;
  public readonly db: LocalDb;
  public readonly queryClient: QueryClient;

  constructor({ localDb, queryClient }: { localDb: LocalDb; queryClient: QueryClient }) {
    this.db = localDb;
    this.mcpManagers = new McpManagersStore({ localDb, queryClient });
    this.queryClient = queryClient;
  }
}
