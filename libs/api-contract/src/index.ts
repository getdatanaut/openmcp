import type {
  ContractRouterClient as BaseContractRouterClient,
  InferContractRouterInputs,
  InferContractRouterOutputs,
} from '@orpc/contract';

import { mpcServersRouterContract } from './mcp-servers.ts';

export const routerContract = {
  ...mpcServersRouterContract,
};

export type RouterInputs = InferContractRouterInputs<typeof routerContract>;

export type RouterOutputs = InferContractRouterOutputs<typeof routerContract>;

export type ContractRouterClient = BaseContractRouterClient<typeof routerContract>;
