import type { BuildQueriesOpts } from '../../types.ts';
import type { AgentMcpToolColNames } from './schema.ts';

export type AgentMcpToolQueries = ReturnType<typeof agentMcpToolQueries>;

export const agentMcpToolQueries = (_: BuildQueriesOpts) => {
  return {};
};

/**
 * The values that are returned by default for queries that return a list of records.
 */
export const summarySelect = ['id', 'agent_id', 'mcp_server_id', 'mcp_tool_id'] satisfies AgentMcpToolColNames[];

export type SummarySelectCols = (typeof summarySelect)[number];

/**
 * The values that are returned by default for queries that return a single record.
 */
export const detailedSelect = [...summarySelect] satisfies AgentMcpToolColNames[];

export type DetailedSelectCols = (typeof detailedSelect)[number];
