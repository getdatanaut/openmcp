import process from 'node:process';

import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import { createORPCReactQueryUtils } from '@orpc/react-query';
import type { RouterClient } from '@orpc/server';
import type { router } from 'web/worker/router.ts';

const link = new RPCLink({
  url: process.env['DATANAUT_API_URL'] ?? 'https://api.datanaut.ai',
  plugins: [],
});

const client: RouterClient<typeof router> = createORPCClient(link);

export const rpc = createORPCReactQueryUtils(client);
