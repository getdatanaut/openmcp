import { createAuth, getUser } from '@libs/auth/server';
import { createDbSdk } from '@libs/db-pg';
import { onError } from '@orpc/client';
import { OpenAPIHandler } from '@orpc/openapi/fetch';
import { RPCHandler } from '@orpc/server/fetch';
import { SimpleCsrfProtectionHandlerPlugin } from '@orpc/server/plugins';
import postgres from 'postgres';

import { API_BASE_PATH, AUTH_BASE_PATH, RPC_BASE_PATH, ZERO_PUSH_PATH } from '~shared/consts.ts';

import type { RootContext } from './middleware.ts';
import { router } from './router.ts';
import { handlePushReq } from './routes/push.ts';

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

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);

    const sql = postgres(env.HYPERDRIVE.connectionString, { max: 5 });
    const db = createDbSdk({ sql });
    const auth = createAuth({
      db,
      baseURL: env.PUBLIC_URL,
      basePath: AUTH_BASE_PATH,
      jwtOpts: {
        expirationTime: '1h', // can set to a low number for things like testing refresh process
      },
      socialProviders: {
        github: {
          clientId: env.GITHUB_CLIENT_ID,
          clientSecret: env.GITHUB_CLIENT_SECRET,
        },
      },
    });

    try {
      if (['GET', 'POST'].includes(req.method) && url.pathname.startsWith(AUTH_BASE_PATH)) {
        return auth.handler(req);
      }

      if (url.pathname.startsWith(ZERO_PUSH_PATH)) {
        return handlePushReq({
          req,
          sql,
          publicUrl: env.PUBLIC_URL,
          getJwks: () => auth.api.getJwks(),
        });
      }

      const session = await getUser(auth, db, { headers: req.headers });

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
        ctx.waitUntil(db.client.destroy());

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
    } catch (error) {
      console.error(error);
      return new Response(null, { status: 500 });
    } finally {
      ctx.waitUntil(db.client.destroy());
    }
  },
} satisfies ExportedHandler<Env>;
