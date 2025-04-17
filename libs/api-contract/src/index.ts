import type {
  ContractRouterClient as BaseContractRouterClient,
  InferContractRouterInputs,
  InferContractRouterOutputs,
} from '@orpc/contract';

import { agentMcpServersRouterContract } from './agent-mcp-servers.ts';
import { agentsRouterContract } from './agents.ts';
import { mpcServersRouterContract } from './mcp-servers.ts';
import { mpcToolsRouterContract } from './mcp-tools.ts';

export const routerContract = {
  ...agentMcpServersRouterContract,
  ...agentsRouterContract,
  ...mpcServersRouterContract,
  ...mpcToolsRouterContract,
};

export type RouterInputs = InferContractRouterInputs<typeof routerContract>;

export type RouterOutputs = InferContractRouterOutputs<typeof routerContract>;

export type ContractRouterClient = BaseContractRouterClient<typeof routerContract>;
