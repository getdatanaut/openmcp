import type { BuildQueriesOpts } from '../../types.ts';
import type { AgentColNames } from './schema.ts';

export type AgentQueries = ReturnType<typeof agentQueries>;

export const agentQueries = (_: BuildQueriesOpts) => {
  return {};
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
