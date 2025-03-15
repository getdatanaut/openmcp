import { Id } from '@libs/utils-ids';

export const ThreadId = Id.dbIdFactory('thread');
export type ThreadNamespace = (typeof ThreadId)['namespace'];
export type TThreadId = ReturnType<(typeof ThreadId)['generate']>;
