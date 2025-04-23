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

export const permissions = definePermissions<AuthData, Schema>(schema, () => {
  const userIsLoggedIn = (authData: AuthData, { cmpLit }: ExpressionBuilder<Schema, AnyTableName>) =>
    cmpLit(authData.sub, 'IS NOT', null);

  const allowIfUserIdMatchesLoggedInUser = (
    authData: AuthData,
    { and, cmp, eb }: ExpressionBuilder<Schema, 'agents'>,
  ) => and(userIsLoggedIn(authData, eb), cmp('userId', '=', authData.sub));

  const allowIfVisibilityIsPublic = (_authData: AuthData, { cmp }: ExpressionBuilder<Schema, 'mcpServers'>) =>
    cmp('visibility', '=', 'public');

  const canReadMcpServer = (authData: AuthData, { or, eb }: ExpressionBuilder<Schema, 'mcpServers'>) =>
    or(allowIfVisibilityIsPublic(authData, eb), allowIfUserIdMatchesLoggedInUser(authData, eb));

  const canReadAgent = (authData: AuthData, { or, eb }: ExpressionBuilder<Schema, 'agents'>) =>
    allowIfUserIdMatchesLoggedInUser(authData, eb);

  return {
    agents: {
      row: {
        select: [canReadAgent],
      },
    },
    agentMcpServers: {
      row: {
        select: [(authData, { exists }) => exists('agent', q => q.where(eb => canReadAgent(authData, eb)))],
      },
    },
    agentMcpTools: {
      row: {
        select: [(authData, { exists }) => exists('agent', q => q.where(eb => canReadAgent(authData, eb)))],
      },
    },
    mcpServers: {
      row: {
        select: [canReadMcpServer],
      },
    },
    mcpTools: {
      row: {
        select: [(authData, { exists }) => exists('mcpServer', q => q.where(eb => canReadMcpServer(authData, eb)))],
      },
    },
    users: {
      row: {
        select: [(authData, { cmp, and, eb }) => and(userIsLoggedIn(authData, eb), cmp('id', '=', authData.sub))],
      },
    },
  };
});
