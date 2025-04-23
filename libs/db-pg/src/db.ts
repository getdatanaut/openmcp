import type { AGENT_MCP_SERVERS_KEY, AgentMcpServersTableCols } from './tables/agent-mcp-servers/schema.ts';
import type { AGENT_MCP_TOOLS_KEY, AgentMcpToolsTableCols } from './tables/agent-mcp-tools/schema.ts';
import type { AGENTS_KEY, AgentsTableCols } from './tables/agents/schema.ts';
import type { AUTH_VERIFICATIONS_KEY, AuthVerificationsTableCols } from './tables/auth-verifications/schema.ts';
import type { INVITATIONS_KEY, InvitationsTableCols } from './tables/invitations/schema.ts';
import type { JWKS_KEY, JwksTableCols } from './tables/jwks/schema.ts';
import type { MCP_SERVERS_KEY, McpServersTableCols } from './tables/mcp-servers/schema.ts';
import type { MCP_TOOLS_KEY, McpToolsTableCols } from './tables/mcp-tools/schema.ts';
import type { MEMBERS_KEY, MembersTableCols } from './tables/members/schema.ts';
import type { OAUTH_ACCESS_TOKEN_KEY, OauthAccessTokensTableCols } from './tables/oauth-access-token/schema.ts';
import type { OAUTH_APPLICATION_KEY, OauthApplicationsTableCols } from './tables/oauth-application/schema.ts';
import type { OAUTH_CONSENT_KEY, OauthConsentsTableCols } from './tables/oauth-consent/schema.ts';
import type { ORGANIZATIONS_KEY, OrganizationsTableCols } from './tables/organizations/schema.ts';
import type { USER_ACCOUNTS_KEY, UserAccountsTableCols } from './tables/user-accounts/schema.ts';
import type { USER_SESSIONS_KEY, UserSessionsTableCols } from './tables/user-sessions/schema.ts';
import type { USERS_KEY, UsersTableCols } from './tables/users/schema.ts';

/**
 * Add all of the kysley table typings here.
 *
 * This is passed to kysley when creating a db client in sdk.ts.
 *
 * Please keep in alphabetical order.
 */
export interface DbSchema {
  [AGENT_MCP_TOOLS_KEY]: AgentMcpToolsTableCols;
  [AGENTS_KEY]: AgentsTableCols;
  [AGENT_MCP_SERVERS_KEY]: AgentMcpServersTableCols;
  [AUTH_VERIFICATIONS_KEY]: AuthVerificationsTableCols;
  [INVITATIONS_KEY]: InvitationsTableCols;
  [JWKS_KEY]: JwksTableCols;
  [MCP_SERVERS_KEY]: McpServersTableCols;
  [MCP_TOOLS_KEY]: McpToolsTableCols;
  [MEMBERS_KEY]: MembersTableCols;
  [OAUTH_ACCESS_TOKEN_KEY]: OauthAccessTokensTableCols;
  [OAUTH_APPLICATION_KEY]: OauthApplicationsTableCols;
  [OAUTH_CONSENT_KEY]: OauthConsentsTableCols;
  [ORGANIZATIONS_KEY]: OrganizationsTableCols;
  [USER_ACCOUNTS_KEY]: UserAccountsTableCols;
  [USER_SESSIONS_KEY]: UserSessionsTableCols;
  [USERS_KEY]: UsersTableCols;
}
