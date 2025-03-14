import { createContext } from '@libs/ui-primitives';

import { AppStore } from './app.ts';

export const [RootStoreContext, useRootStore] = createContext<RootStore>({
  name: 'RootStoreContext',
  strict: true,
});

export function createRootStore(): RootStore {
  const rootStore = new RootStore();

  if (import.meta.env.DEV && typeof window !== 'undefined') {
    // @ts-expect-error ignore
    window.__ROOT_STORE__ = rootStore;
  }

  return rootStore;
}

export class RootStore {
  app = new AppStore();
}
