import type { TUserId } from '@libs/db-ids';

import type { BuildQueriesOpts } from '../../types.ts';
import { type AgentMcpServerColNames, AGENTS_MCP_SERVERS_KEY } from './schema.ts';

export type AgentMcpServerQueries = ReturnType<typeof agentMcpServerQueries>;

export const agentMcpServerQueries = ({ db }: BuildQueriesOpts) => {
  function byUserId({ userId }: { userId: TUserId }) {
    return db.selectFrom(AGENTS_MCP_SERVERS_KEY).select(summarySelect).where('userId', '=', userId);
  }

  return {
    byUserId,
  };
};

/**
 * The values that are returned by default for queries that return a list of records.
 */
export const summarySelect = ['id', 'agentId', 'mcpServerId'] satisfies AgentMcpServerColNames[];

export type SummarySelectCols = (typeof summarySelect)[number];

/**
 * The values that are returned by default for queries that return a single record.
 */
export const detailedSelect = [...summarySelect, 'config'] satisfies AgentMcpServerColNames[];

export type DetailedSelectCols = (typeof detailedSelect)[number];
