import { Id } from '@libs/utils-ids';
import _slugify from '@sindresorhus/slugify';

export const UserId = Id.dbIdFactory('u');
export type UserNamespace = (typeof UserId)['namespace'];
export type TUserId = ReturnType<(typeof UserId)['generate']>;

export const UserSessionId = Id.dbIdFactory('sess');
export type UserSessionNamespace = (typeof UserSessionId)['namespace'];
export type TUserSessionId = ReturnType<(typeof UserSessionId)['generate']>;

export const UserAccountId = Id.dbIdFactory('acc');
export type UserAccountNamespace = (typeof UserAccountId)['namespace'];
export type TUserAccountId = ReturnType<(typeof UserAccountId)['generate']>;

export const OrganizationId = Id.dbIdFactory('org');
export type OrganizationNamespace = (typeof OrganizationId)['namespace'];
export type TOrganizationId = ReturnType<(typeof OrganizationId)['generate']>;

export const MemberId = Id.dbIdFactory('mem');
export type MemberNamespace = (typeof MemberId)['namespace'];
export type TMemberId = ReturnType<(typeof MemberId)['generate']>;

export const InviteId = Id.dbIdFactory('inv');
export type InviteNamespace = (typeof InviteId)['namespace'];
export type TInviteId = ReturnType<(typeof InviteId)['generate']>;

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

export const OauthConsentId = Id.dbIdFactory('oauthcon');
export type OauthConsentNamespace = (typeof OauthConsentId)['namespace'];
export type TOauthConsentId = ReturnType<(typeof OauthConsentId)['generate']>;

export const OauthApplicationId = Id.dbIdFactory('oauthapp');
export type OauthApplicationNamespace = (typeof OauthApplicationId)['namespace'];
export type TOauthApplicationId = ReturnType<(typeof OauthApplicationId)['generate']>;

export type TSlug = string & { __slug: true };

export function slugify(slug: string): TSlug {
  return _slugify(slug) as TSlug;
}
