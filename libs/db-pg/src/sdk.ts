import { initClient, type InitClientOpts, type PgClientMetrics } from '@libs/db-pg-client';
import type { Kysely, Transaction } from 'kysely';

import type { DbSchema } from './db.ts';
import { AGENT_MCP_SERVERS_KEY, agentMcpServerQueries } from './tables/agent-mcp-servers/index.ts';
import { AGENT_MCP_TOOLS_KEY, agentMcpToolQueries } from './tables/agent-mcp-tools/index.ts';
import { agentQueries, AGENTS_KEY } from './tables/agents/index.ts';
import { AUTH_VERIFICATIONS_KEY, authVerificationQueries } from './tables/auth-verifications/index.ts';
import { invitationQueries, INVITATIONS_KEY } from './tables/invitations/index.ts';
import { jwksQueries } from './tables/jwks/queries.ts';
import { JWKS_KEY } from './tables/jwks/schema.ts';
import { MCP_SERVERS_KEY, mcpServerQueries } from './tables/mcp-servers/index.ts';
import { MCP_TOOLS_KEY, mcpToolQueries } from './tables/mcp-tools/index.ts';
import { memberQueries, MEMBERS_KEY } from './tables/members/index.ts';
import { OAUTH_ACCESS_TOKEN_KEY, oauthAccessTokenQueries } from './tables/oauth-access-token/index.ts';
import { OAUTH_APPLICATION_KEY, oauthApplicationQueries } from './tables/oauth-application/index.ts';
import { OAUTH_CONSENT_KEY, oauthConsentQueries } from './tables/oauth-consent/index.ts';
import { organizationQueries, ORGANIZATIONS_KEY } from './tables/organizations/index.ts';
import { USER_ACCOUNTS_KEY, userAccountQueries } from './tables/user-accounts/index.ts';
import { USER_SESSIONS_KEY, userSessionQueries } from './tables/user-sessions/index.ts';
import { userQueries, USERS_KEY } from './tables/users/index.ts';

type InitDbSdkOpts = InitClientOpts;

export type DbSdk = ReturnType<typeof createDbSdk>;

export const createDbSdk = (opts: InitDbSdkOpts) => {
  const { db, metrics } = initClient<DbSchema>(opts);

  return initSdk({ db, metrics });
};

const initSdk = ({ db, metrics }: { db: Kysely<DbSchema>; metrics: PgClientMetrics }) => {
  // Please keep in alphabetical order.
  const queries = {
    [AGENT_MCP_SERVERS_KEY]: agentMcpServerQueries({ db }),
    [AGENT_MCP_TOOLS_KEY]: agentMcpToolQueries({ db }),
    [AGENTS_KEY]: agentQueries({ db }),
    [AUTH_VERIFICATIONS_KEY]: authVerificationQueries({ db }),
    [INVITATIONS_KEY]: invitationQueries({ db }),
    [JWKS_KEY]: jwksQueries({ db }),
    [MCP_SERVERS_KEY]: mcpServerQueries({ db }),
    [MCP_TOOLS_KEY]: mcpToolQueries({ db }),
    [MEMBERS_KEY]: memberQueries({ db }),
    [OAUTH_ACCESS_TOKEN_KEY]: oauthAccessTokenQueries({ db }),
    [OAUTH_APPLICATION_KEY]: oauthApplicationQueries({ db }),
    [OAUTH_CONSENT_KEY]: oauthConsentQueries({ db }),
    [ORGANIZATIONS_KEY]: organizationQueries({ db }),
    [USER_ACCOUNTS_KEY]: userAccountQueries({ db }),
    [USER_SESSIONS_KEY]: userSessionQueries({ db }),
    [USERS_KEY]: userQueries({ db }),
  };

  return {
    client: db,
    metrics,
    queries,
    transaction: <T>(callback: (props: { trx: Transaction<DbSchema>; trxQueries: typeof queries }) => Promise<T>) => {
      return db.transaction().execute(async trx => {
        try {
          const res = await callback({ trx, trxQueries: initSdk({ db: trx, metrics }).queries });
          return res;
        } catch (err) {
          console.error(`Transaction failed: ${err}`);
          throw err;
        }
      });
    },
    [Symbol.asyncDispose]: async () => {
      await db.destroy();
    },
  };
};
