import { AgentId } from '@libs/db-ids';
import type { AgentDetailedSelect, AgentSummarySelect } from '@libs/db-pg';
import type { Config as RemixDefinition } from '@openmcp/remix';
import { type } from '@orpc/contract';
import { z } from 'zod';

import { base } from './base.ts';

const listAgentsContract = base
  .route({ method: 'GET', path: '/agents' })
  .input(z.object({ name: z.string().optional() }))
  .output(type<AgentSummarySelect[]>())
  .errors({ NOT_FOUND: {} });

const getAgentContract = base
  .route({ method: 'GET', path: '/agents/{agentId}' })
  .input(z.object({ agentId: AgentId.validator }))
  .output(type<AgentDetailedSelect>())
  .errors({ NOT_FOUND: {} });

const getRemixContract = base
  .route({ method: 'GET', path: '/agents/{agentId}/remix' })
  .input(z.object({ agentId: AgentId.validator }))
  .output(type<RemixDefinition>())
  .errors({ NOT_FOUND: {} });

export const agentsRouterContract = {
  agents: {
    listAgents: listAgentsContract,
    getAgent: getAgentContract,
    getRemix: getRemixContract,
  },
};
