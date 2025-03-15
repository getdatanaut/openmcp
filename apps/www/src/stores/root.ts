import type { LocalDb } from '~/utils/local-db.ts';

import { AppStore } from './app.ts';
import { McpManagersStore } from './mcp-managers.ts';

export function createRootStore({ localDb }: { localDb: LocalDb }): RootStore {
  const rootStore = new RootStore({ localDb });

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

  constructor({ localDb }: { localDb: LocalDb }) {
    this.db = localDb;
    this.mcpManagers = new McpManagersStore({ localDb });
  }
}
