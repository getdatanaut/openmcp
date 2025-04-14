import { Id } from '@libs/utils-ids';

export const UserId = Id.dbIdFactory('u');
export type UserNamespace = (typeof UserId)['namespace'];
export type TUserId = ReturnType<(typeof UserId)['generate']>;

export const UserSessionId = Id.dbIdFactory('sess');
export type UserSessionNamespace = (typeof UserSessionId)['namespace'];
export type TUserSessionId = ReturnType<(typeof UserSessionId)['generate']>;

export const UserAccountId = Id.dbIdFactory('acc');
export type UserAccountNamespace = (typeof UserAccountId)['namespace'];
export type TUserAccountId = ReturnType<(typeof UserAccountId)['generate']>;

export const AuthVerificationId = Id.dbIdFactory('ver');
export type AuthVerificationNamespace = (typeof AuthVerificationId)['namespace'];
export type TAuthVerificationId = ReturnType<(typeof AuthVerificationId)['generate']>;

export const McpServerId = Id.dbIdFactory('ms');
export type McpServerNamespace = (typeof McpServerId)['namespace'];
export type TMcpServerId = ReturnType<(typeof McpServerId)['generate']>;

export const McpToolId = Id.dbIdFactory('mt');
export type McpToolNamespace = (typeof McpToolId)['namespace'];
export type TMcpToolId = ReturnType<(typeof McpToolId)['generate']>;

export const AgentId = Id.dbIdFactory('ag');
export type AgentNamespace = (typeof AgentId)['namespace'];
export type TAgentId = ReturnType<(typeof AgentId)['generate']>;

export const AgentMcpServerId = Id.dbIdFactory('agms');
export type AgentMcpServerNamespace = (typeof AgentMcpServerId)['namespace'];
export type TAgentMcpServerId = ReturnType<(typeof AgentMcpServerId)['generate']>;

export const AgentMcpToolId = Id.dbIdFactory('agmt');
export type AgentMcpToolNamespace = (typeof AgentMcpToolId)['namespace'];
export type TAgentMcpToolId = ReturnType<(typeof AgentMcpToolId)['generate']>;
