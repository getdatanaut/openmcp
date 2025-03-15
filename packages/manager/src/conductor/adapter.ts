import { type UIMessage } from 'ai';

import type { Manager } from '../manager.ts';

/**
 * Custom conductor implementations must implement this interface.
 */
export interface MpcConductor {
  handleMessage: (opts: { threadId: string; message: UIMessage; history?: UIMessage[] }) => Promise<Response>;
}

export type MpcConductorFactory = (manager: Manager) => MpcConductor;
