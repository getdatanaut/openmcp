import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import { createORPCReactQueryUtils } from '@orpc/react-query';
import type { RouterClient } from '@orpc/server';

import { RPC_BASE_PATH } from '../../worker/consts.ts';
import type { router } from '../../worker/router.ts';

const link = new RPCLink({
  url: RPC_BASE_PATH,
});

const client: RouterClient<typeof router> = createORPCClient(link);

export const rpc = createORPCReactQueryUtils(client);
