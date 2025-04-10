import { createContext } from '@libs/ui-primitives';
import { type McpConductor, type McpManager } from '@openmcp/manager';

export const [CurrentManagerContext, useCurrentManager] = createContext<{
  manager: McpManager;
  conductor: McpConductor;
}>({
  name: 'CurrentManagerContext',
  strict: true,
});
