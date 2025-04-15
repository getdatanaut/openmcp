import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import { SimpleCsrfProtectionLinkPlugin } from '@orpc/client/plugins';
import { createORPCReactQueryUtils } from '@orpc/react-query';
import type { RouterClient } from '@orpc/server';

import { RPC_BASE_PATH } from '../../worker/consts.ts';
import type { router } from '../../worker/router.ts';

const link = new RPCLink({
  url: `${window.location.origin}${RPC_BASE_PATH}`,
  plugins: [new SimpleCsrfProtectionLinkPlugin()],
});

const client: RouterClient<typeof router> = createORPCClient(link);

export const rpc = createORPCReactQueryUtils(client);
