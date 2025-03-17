import { Id } from '@libs/utils-ids';

export const ThreadId = Id.dbIdFactory('thread');
export type ThreadNamespace = (typeof ThreadId)['namespace'];
export type TThreadId = ReturnType<(typeof ThreadId)['generate']>;

export const McpServerId = Id.dbIdFactory('srv');
export type McpServerNamespace = (typeof McpServerId)['namespace'];
export type TMcpServerId = ReturnType<(typeof McpServerId)['generate']>;

export const ClientServerId = Id.dbIdFactory('csrv');
export type ClientServerNamespace = (typeof ClientServerId)['namespace'];
export type TClientServerId = ReturnType<(typeof ClientServerId)['generate']>;
