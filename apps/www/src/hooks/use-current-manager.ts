import { createContext } from '@libs/ui-primitives';
import type { McpManager } from '@openmcp/manager';

import type { McpConductor } from '~/utils/conductor/index.ts';
import type { ThreadManager } from '~/utils/threads.ts';

export const [CurrentManagerContext, useCurrentManager] = createContext<{
  manager: McpManager;
  conductor: McpConductor;
  threadManager: ThreadManager;
}>({
  name: 'CurrentManagerContext',
  strict: true,
});
