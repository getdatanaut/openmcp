import { createAuth, getUser } from '@libs/auth/server';
import { slugify } from '@libs/db-ids';
import { createDbSdk } from '@libs/db-pg';
import postgres from 'postgres';

import { API_BASE_PATH, AUTH_BASE_PATH, RPC_BASE_PATH, ZERO_PUSH_PATH } from '~shared/consts.ts';

import { handler as orpcHandler } from './orpc/index.ts';
import { handler as zeroPushHandler } from './zero/index.ts';

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);

    const sql = postgres(env.HYPERDRIVE.connectionString, { max: 5 });
    const db = createDbSdk({ sql });
    const auth = createAuth({
      db,
      baseURL: env.PUBLIC_URL,
      basePath: AUTH_BASE_PATH,
      secret: env.DB_ENC_SECRET,
      loginPage: '/login',
      jwtOpts: {
        expirationTime: '1h', // can set to a low number for things like testing refresh process
      },
      socialProviders: {
        github: {
          clientId: env.GITHUB_CLIENT_ID,
          clientSecret: env.GITHUB_CLIENT_SECRET,
        },
      },
      async generateOrgData(user) {
        const username = user.email.split('@')[0]?.split('+')[0];
        const randomStr = Math.random().toString(16).slice(4, 10);
        return {
          name: `${username}'s Organization`,
          slug: slugify(`${username}_${randomStr}`),
        };
      },
    });

    let res: Response | undefined;

    try {
      /**
       * Auth route handling
       */
      if (['GET', 'POST'].includes(req.method) && url.pathname.startsWith(AUTH_BASE_PATH)) {
        return auth.handler(req);
      }

      /**
       * Zero push route handling
       */
      if (url.pathname.startsWith(ZERO_PUSH_PATH)) {
        return zeroPushHandler({
          req,
          sql,
          publicUrl: env.PUBLIC_URL,
          getJwks: () => auth.api.getJwks(),
          dbEncSecret: env.DB_ENC_SECRET,
        });
      }

      const session = await getUser(auth, db, { headers: req.headers });

      /**
       * ORPC route handling
       */
      res = await orpcHandler({
        req,
        env,
        db,
        user: session?.user,
        session: session?.session,
        rpcBasePath: RPC_BASE_PATH,
        apiBasePath: API_BASE_PATH,
      });

      if (res) return res;

      /**
       * Fallback handling
       */
      return new Response(null, { status: 404 });
    } catch (error) {
      console.error(error);
      return new Response(null, { status: 500 });
    } finally {
      ctx.waitUntil(db.client.destroy());
    }
  },
} satisfies ExportedHandler<Env>;
