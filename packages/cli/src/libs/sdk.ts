import type { ContractRouterClient } from '@libs/api-contract';
import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import { SimpleCsrfProtectionLinkPlugin } from '@orpc/client/plugins';

import env from '../env.ts';
import { client } from './auth/index.ts';

const link = new RPCLink({
  url: new URL('__rpc', env.DN_API_URL),
  plugins: [new SimpleCsrfProtectionLinkPlugin()],
  async headers() {
    try {
      const bearer = await client.generateAccessToken();
      return {
        Authorization: `Bearer ${bearer}`,
        'X-Bearer-Format': 'opaque',
      };
    } catch {
      return {}
    }
  },
});

export const rpcClient: ContractRouterClient = createORPCClient(link);
