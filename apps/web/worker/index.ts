// import { RPCHandler } from '@orpc/server/fetch';
// import { CORSPlugin } from '@orpc/server/plugins';

// const handler = new RPCHandler(router, {
//   plugins: [new CORSPlugin()],
// });

import { createAuth } from '@libs/auth/server';
import { createDbSdk } from '@libs/db-pg';

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);

    const db = createDbSdk({ uri: env.HYPERDRIVE.connectionString, max: 5 });
    const auth = createAuth({ db });

    if (['GET', 'POST'].includes(req.method) && url.pathname.startsWith('/api/auth')) {
      const res = await auth.handler(req);

      ctx.waitUntil(db.client.destroy());

      return res;
    }

    // const { matched, response } = await handler.handle(request, {
    //   prefix: '/rpc',
    //   context: {}, // Provide initial context if needed
    // });

    // if (matched) {
    //   return response;
    // }

    ctx.waitUntil(db.client.destroy());

    return new Response(null, { status: 404 });
  },
} satisfies ExportedHandler<Env>;
