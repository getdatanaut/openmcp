import type { TUserId } from '@libs/db-ids';

import type { BuildQueriesOpts } from '../../types.ts';
import { type AgentColNames, AGENTS_KEY } from './schema.ts';

export type AgentQueries = ReturnType<typeof agentQueries>;

export const agentQueries = ({ db }: BuildQueriesOpts) => {
  function listByUserId({ userId }: { userId: TUserId }) {
    return db.selectFrom(AGENTS_KEY).select(summarySelect).where('userId', '=', userId).execute();
  }

  return {
    listByUserId,
  };
};

/**
 * The values that are returned by default for queries that return a list of records.
 */
export const summarySelect = ['id', 'name', 'createdAt', 'updatedAt'] satisfies AgentColNames[];

export type SummarySelectCols = (typeof summarySelect)[number];

/**
 * The values that are returned by default for queries that return a single record.
 */
export const detailedSelect = [...summarySelect, 'instructions'] satisfies AgentColNames[];

export type DetailedSelectCols = (typeof detailedSelect)[number];
