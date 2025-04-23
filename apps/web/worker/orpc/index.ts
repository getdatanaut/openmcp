import type { AuthSession, AuthUser } from '@libs/auth/types';
import type { DbSdk } from '@libs/db-pg';
import { onError } from '@orpc/client';
import { OpenAPIHandler } from '@orpc/openapi/fetch';
import { RPCHandler } from '@orpc/server/fetch';
import { SimpleCsrfProtectionHandlerPlugin } from '@orpc/server/plugins';

import { agentsRouter } from './agents.ts';
import { mpcServersRouter } from './mcp-servers.ts';
import { base, type RootContext } from './middleware.ts';

const router = base.router({
  mcpServers: mpcServersRouter.mcpServers,
  agents: agentsRouter.agents,
});

const openApiHandler = new OpenAPIHandler(router, {
  plugins: [],
  interceptors: [
    onError(error => {
      console.error('Error in OpenAPIHandler', error);
    }),
  ],
});

const rpcHandler = new RPCHandler(router, {
  plugins: [new SimpleCsrfProtectionHandlerPlugin()],
  interceptors: [
    onError(error => {
      console.error('Error in RPCHandler', error);
    }),
  ],
});

export async function handler({
  req,
  env,
  db,
  user,
  session,
  rpcBasePath,
  apiBasePath,
}: {
  req: Request;
  env: Env;
  db: DbSdk;
  user?: AuthUser | null;
  session?: AuthSession | null;
  rpcBasePath: `/${string}`;
  apiBasePath: `/${string}`;
}) {
  const orpcContext = {
    publicUrl: env.PUBLIC_URL,
    db,
    user: user ?? null,
    session: session ?? null,
    organizationId: session?.activeOrganizationId ?? null,
    r2OpenApiBucket: env.OPENMCP_OPENAPI,
  } satisfies RootContext;

  const rpcRes = await rpcHandler.handle(req, {
    prefix: rpcBasePath,
    context: orpcContext,
  });

  if (rpcRes.matched) {
    return rpcRes.response;
  }

  const openApiRes = await openApiHandler.handle(req, {
    prefix: apiBasePath,
    context: orpcContext,
  });

  if (openApiRes.matched) {
    return openApiRes.response;
  }
}
