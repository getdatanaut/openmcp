import process from 'node:process';

import type { ContractRouterClient } from '@libs/api-contract';
import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';

const link = new RPCLink({
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  url: process.env['DATANAUT_API_URL'] ?? 'https://api.datanaut.ai/__rpc',
});

export const rpcClient: ContractRouterClient = createORPCClient(link);
