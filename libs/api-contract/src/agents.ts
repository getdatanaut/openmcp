import { AgentId } from '@libs/db-ids';
import type { AgentDetailedSelect, AgentSummarySelect } from '@libs/db-pg';
import { type } from '@orpc/contract';
import { z } from 'zod';

import { base } from './base.ts';

const listContract = base.output(type<AgentSummarySelect[]>());

const getContract = base
  .input(z.object({ id: AgentId.validator }))
  .output(type<AgentDetailedSelect>())
  .errors({ NOT_FOUND: {} });

const createContract = base
  .input(z.object({ name: z.string().min(2).max(64).optional() }))
  .output(type<AgentDetailedSelect>());

export const agentsRouterContract = {
  agents: {
    list: listContract,
    get: getContract,
    create: createContract,
  },
};
