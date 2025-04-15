import { type AuthSession, type AuthUser, createAuth } from '@libs/auth/server';
import { createDbSdk } from '@libs/db-pg';
import { OpenAPIHandler } from '@orpc/openapi/fetch';
import { RPCHandler } from '@orpc/server/fetch';
import { SimpleCsrfProtectionHandlerPlugin } from '@orpc/server/plugins';

import { API_BASE_PATH, AUTH_BASE_PATH, RPC_BASE_PATH } from './consts.ts';
import type { RootContext } from './middleware.ts';
import { router } from './router.ts';

const openApiHandler = new OpenAPIHandler(router, {
  plugins: [],
});

const rpcHandler = new RPCHandler(router, {
  plugins: [new SimpleCsrfProtectionHandlerPlugin()],
});

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);

    const db = createDbSdk({ uri: env.HYPERDRIVE.connectionString, max: 5 });
    const auth = createAuth({
      db,
      basePath: AUTH_BASE_PATH,
      socialProviders: {
        github: {
          clientId: env.GITHUB_CLIENT_ID,
          clientSecret: env.GITHUB_CLIENT_SECRET,
        },
      },
    });

    if (['GET', 'POST'].includes(req.method) && url.pathname.startsWith(AUTH_BASE_PATH)) {
      const res = await auth.handler(req);

      ctx.waitUntil(db.client.destroy());

      return res;
    }

    ctx.waitUntil(db.client.destroy());

    const session = (await auth.api.getSession({ headers: req.headers })) as {
      user: AuthUser;
      session: AuthSession;
    } | null;

    const orpcContext = {
      db,
      user: session?.user ?? null,
      session: session?.session ?? null,
      r2OpenApiBucket: env.OPENMCP_OPENAPI,
    } satisfies RootContext;

    const rpcRes = await rpcHandler.handle(req, {
      prefix: RPC_BASE_PATH,
      context: orpcContext,
    });

    if (rpcRes.matched) {
      return rpcRes.response;
    }

    const openApiRes = await openApiHandler.handle(req, {
      prefix: API_BASE_PATH,
      context: orpcContext,
    });

    if (openApiRes.matched) {
      return openApiRes.response;
    }

    return new Response(null, { status: 404 });
  },
} satisfies ExportedHandler<Env>;
