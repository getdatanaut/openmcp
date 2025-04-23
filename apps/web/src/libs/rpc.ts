import type { ContractRouterClient } from '@libs/api-contract';
import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import { SimpleCsrfProtectionLinkPlugin } from '@orpc/client/plugins';
import { createORPCReactQueryUtils } from '@orpc/react-query';

import { RPC_BASE_PATH } from '~shared/consts.ts';

const link = new RPCLink({
  url: `${window.location.origin}${RPC_BASE_PATH}`,
  plugins: [new SimpleCsrfProtectionLinkPlugin()],
});

const client: ContractRouterClient = createORPCClient(link);

export const rpc = createORPCReactQueryUtils(client);
