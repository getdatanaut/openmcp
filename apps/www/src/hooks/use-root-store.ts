import { createContext } from '@libs/ui-primitives';

import type { RootStore } from '~/stores/root.ts';

export const [RootStoreContext, useRootStore] = createContext<RootStore>({
  name: 'RootStoreContext',
  strict: true,
});
