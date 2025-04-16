import type { DbSdk } from '@libs/db-pg';
import { type } from '@orpc/contract';

import { base } from './base.ts';

const listAgentsContract = base.output(type<Awaited<ReturnType<DbSdk['queries']['agents']['listByUserId']>>>());

export const agentsRouterContract = {
  agents: {
    list: listAgentsContract,
  },
};
