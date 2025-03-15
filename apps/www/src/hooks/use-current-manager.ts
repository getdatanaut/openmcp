import { createContext } from '@libs/ui-primitives';
import type { Manager } from '@openmcp/manager';

export const [CurrentManagerContext, useCurrentManager] = createContext<Manager>({
  name: 'CurrentManagerContext',
  strict: true,
});
