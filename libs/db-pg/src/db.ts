import type { AGENT_MCP_SERVERS_KEY, AgentMcpServersTableCols } from './tables/agent-mcp-servers/schema.ts';
import type { AGENT_MCP_TOOLS_KEY, AgentMcpToolsTableCols } from './tables/agent-mcp-tools/schema.ts';
import type { AGENTS_KEY, AgentsTableCols } from './tables/agents/schema.ts';
import type { AUTH_VERIFICATIONS_KEY, AuthVerificationsTableCols } from './tables/auth-verifications/schema.ts';
import type { JWKS_KEY, JwksTableCols } from './tables/jwks/schema.ts';
import type { MCP_SERVERS_KEY, McpServersTableCols } from './tables/mcp-servers/schema.ts';
import type { MCP_TOOLS_KEY, McpToolsTableCols } from './tables/mcp-tools/schema.ts';
import type { OAUTH_ACCESS_TOKEN_KEY, OauthAccessTokenTableCols } from './tables/oauth-access-token/schema.ts';
import type { OAUTH_APPLICATION_KEY, OauthApplicationTableCols } from './tables/oauth-application/schema.ts';
import type { OAUTH_CONSENT_KEY, OauthConsentTableCols } from './tables/oauth-consent/schema.ts';
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
  [JWKS_KEY]: JwksTableCols;
  [MCP_SERVERS_KEY]: McpServersTableCols;
  [MCP_TOOLS_KEY]: McpToolsTableCols;
  [OAUTH_ACCESS_TOKEN_KEY]: OauthAccessTokenTableCols;
  [OAUTH_APPLICATION_KEY]: OauthApplicationTableCols;
  [OAUTH_CONSENT_KEY]: OauthConsentTableCols;
  [USER_ACCOUNTS_KEY]: UserAccountsTableCols;
  [USER_SESSIONS_KEY]: UserSessionsTableCols;
  [USERS_KEY]: UsersTableCols;
}
