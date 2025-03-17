import type { UIMessage } from 'ai';

import type { MpcManager } from '../manager.ts';
import type { ClientId, ThreadId } from '../types.ts';

/**
 * Custom conductor implementations must implement this interface.
 */
export interface MpcConductor {
  handleMessage: (opts: {
    clientId: ClientId;

    message: UIMessage;

    /** The consumer may or may not provide a threadId that can be used to store the response messages */
    threadId?: ThreadId;

    /** The consumer may or may not provide some portion of the message history for consideration */
    history?: UIMessage[];
  }) => Promise<Response>;
}

export type MpcConductorFactory = (manager: MpcManager) => MpcConductor;
