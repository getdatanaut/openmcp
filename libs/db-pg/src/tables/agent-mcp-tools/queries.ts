import { AgentMcpToolId, type TAgentMcpToolId } from '@libs/db-ids';

import type { BuildQueriesOpts } from '../../types.ts';
import { AGENT_MCP_TOOLS_KEY, type AgentMcpToolColNames, type NewAgentMcpTool } from './schema.ts';

export type AgentMcpToolQueries = ReturnType<typeof agentMcpToolQueries>;

export const agentMcpToolQueries = ({ db }: BuildQueriesOpts) => {
  function create(values: NewAgentMcpTool) {
    return db
      .insertInto(AGENT_MCP_TOOLS_KEY)
      .values({
        id: AgentMcpToolId.generate(),
        ...values,
      })
      .returning(['id'])
      .executeTakeFirstOrThrow();
  }

  function remove(values: { id: TAgentMcpToolId }) {
    return db.deleteFrom(AGENT_MCP_TOOLS_KEY).where('id', '=', values.id).execute();
  }

  return {
    create,
    remove,
  };
};

/**
 * The values that are returned by default for queries that return a list of records.
 */
export const summarySelect = [
  'id',
  'agentId',
  'mcpServerId',
  'mcpToolId',
  'agentMcpServerId',
] satisfies AgentMcpToolColNames[];

export type SummarySelectCols = (typeof summarySelect)[number];

/**
 * The values that are returned by default for queries that return a single record.
 */
export const detailedSelect = [...summarySelect] satisfies AgentMcpToolColNames[];

export type DetailedSelectCols = (typeof detailedSelect)[number];
