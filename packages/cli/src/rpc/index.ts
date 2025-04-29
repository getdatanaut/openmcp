import type {
  ContractRouterClient as BaseContractRouterClient,
  InferContractRouterInputs,
  InferContractRouterOutputs,
} from '@orpc/contract';

import { agentsRouterContract } from './agents.ts';
import { mcpServersRouterContract } from './mcp-servers.ts';

export const routerContract = {
  cli: {
    ...agentsRouterContract,
    ...mcpServersRouterContract,
  },
};

export type RouterInputs = InferContractRouterInputs<typeof routerContract>;

export type RouterOutputs = InferContractRouterOutputs<typeof routerContract>;

export type ContractRouterClient = BaseContractRouterClient<typeof routerContract>;
