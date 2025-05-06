import { type } from '@orpc/contract';
import { z } from 'zod';

import type { Config as RemixDefinition } from '#libs/remix';

import { base } from './base.ts';

export type Agent = {
  id: string;
  name: string;
};

const listAgentsContract = base
  .input(z.object({ name: z.string().optional() }))
  .output(type<Agent[]>())
  .errors({ NOT_FOUND: {} });

const getAgentContract = base
  .input(z.object({ agentId: z.string() }))
  .output(type<Agent>())
  .errors({ NOT_FOUND: {} });

const getRemixContract = base
  .input(z.object({ agentId: z.string() }))
  .output(type<RemixDefinition>())
  .errors({ NOT_FOUND: {} });

export const agentsRouterContract = {
  agents: base.router({
    listAgents: listAgentsContract,
    getAgent: getAgentContract,
    getRemix: getRemixContract,
  }),
};
