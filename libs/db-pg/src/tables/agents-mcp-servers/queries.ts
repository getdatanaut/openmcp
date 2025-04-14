import type { BuildQueriesOpts } from '../../types.ts';
import type { AgentMcpServerColNames } from './schema.ts';

export type AgentMcpServerQueries = ReturnType<typeof agentMcpServerQueries>;

export const agentMcpServerQueries = (_: BuildQueriesOpts) => {
  return {};
};

/**
 * The values that are returned by default for queries that return a list of records.
 */
export const summarySelect = ['id', 'agent_id', 'mcp_server_id'] satisfies AgentMcpServerColNames[];

export type SummarySelectCols = (typeof summarySelect)[number];

/**
 * The values that are returned by default for queries that return a single record.
 */
export const detailedSelect = [...summarySelect, 'config'] satisfies AgentMcpServerColNames[];

export type DetailedSelectCols = (typeof detailedSelect)[number];
