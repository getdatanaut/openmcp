import { definePermissions, type ExpressionBuilder, type Row } from '@rocicorp/zero';

import type { AuthData } from './auth.ts';
import { type Schema, schema } from './zero-schema.gen.ts';

export { type Schema, schema };

type AnyTableName = keyof Schema['tables'];

export type Agent = Row<typeof schema.tables.agents>;
export type AgentMcpServer = Row<typeof schema.tables.agentMcpServers>;
export type AgentMcpTool = Row<typeof schema.tables.agentMcpTools>;
export type McpServer = Row<typeof schema.tables.mcpServers>;
export type McpTool = Row<typeof schema.tables.mcpTools>;
export type User = Row<typeof schema.tables.users>;

export const userIsLoggedIn = (authData: AuthData, { cmpLit }: ExpressionBuilder<Schema, AnyTableName>) =>
  cmpLit(authData.sub, 'IS NOT', null);

export const allowIfUserIdMatchesLoggedInUser = (
  authData: AuthData,
  { and, cmp, eb }: ExpressionBuilder<Schema, 'agents'>,
) => and(userIsLoggedIn(authData, eb), cmp('createdBy', '=', authData.sub));

export const allowIfOrgIdMatchesLoggedInUser = (authData: AuthData, { cmp }: ExpressionBuilder<Schema, 'agents'>) =>
  cmp('organizationId', authData.orgId ?? 'org_xxx');

export const allowIfVisibilityIsPublic = (_authData: AuthData, { cmp }: ExpressionBuilder<Schema, 'mcpServers'>) =>
  cmp('visibility', 'public');

export const canReadMcpServer = (authData: AuthData, { or, eb }: ExpressionBuilder<Schema, 'mcpServers'>) =>
  or(allowIfVisibilityIsPublic(authData, eb), allowIfOrgIdMatchesLoggedInUser(authData, eb));

export const canReadMcpTool = (authData: AuthData, { exists }: ExpressionBuilder<Schema, 'mcpTools'>) =>
  exists('mcpServer', q => q.where(eb => canReadMcpServer(authData, eb)));

export const canReadAgent = (authData: AuthData, eb: ExpressionBuilder<Schema, 'agents'>) =>
  allowIfOrgIdMatchesLoggedInUser(authData, eb);

export const canReadAgentMcpServer = (authData: AuthData, { exists }: ExpressionBuilder<Schema, 'agentMcpServers'>) =>
  exists('agent', q => q.where(eb => canReadAgent(authData, eb)));

export const canReadAgentMcpTool = (authData: AuthData, { exists }: ExpressionBuilder<Schema, 'agentMcpServers'>) =>
  exists('agent', q => q.where(eb => canReadAgent(authData, eb)));

export const canReadUser = (authData: AuthData, { and, cmp, eb }: ExpressionBuilder<Schema, 'users'>) =>
  and(userIsLoggedIn(authData, eb), cmp('id', '=', authData.sub));

export const permissions = definePermissions<AuthData, Schema>(schema, () => {
  return {
    agents: {
      row: {
        select: [canReadAgent],
      },
    },
    agentMcpServers: {
      row: {
        select: [canReadAgentMcpServer],
      },
    },
    agentMcpTools: {
      row: {
        select: [canReadAgentMcpTool],
      },
    },
    mcpServers: {
      row: {
        select: [canReadMcpServer],
      },
    },
    mcpTools: {
      row: {
        select: [canReadMcpTool],
      },
    },
    users: {
      row: {
        select: [canReadUser],
      },
    },
  };
});
