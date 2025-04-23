import { AgentMcpServerId, type TAgentId, type TOrganizationId } from '@libs/db-ids';
import { jsonArrayFrom } from 'kysely/helpers/postgres';

import type { BuildQueriesOpts } from '../../types.ts';
import { summarySelect as agentMcpToolSummarySelect } from '../agent-mcp-tools/queries.ts';
import { AGENT_MCP_TOOLS_KEY } from '../agent-mcp-tools/schema.ts';
import { type AgentMcpServerColNames, AGENTS_MCP_SERVERS_KEY, type NewAgentMcpServer } from './schema.ts';

export type AgentMcpServerQueries = ReturnType<typeof agentMcpServerQueries>;

export const agentMcpServerQueries = ({ db }: BuildQueriesOpts) => {
  function list({ organizationId }: { organizationId: TOrganizationId }) {
    return db
      .selectFrom(AGENTS_MCP_SERVERS_KEY)
      .select(summarySelect)
      .where('organizationId', '=', organizationId)
      .execute();
  }

  function listWithTools({ agentId }: { agentId: TAgentId }) {
    return db
      .selectFrom(AGENTS_MCP_SERVERS_KEY)
      .select(eb => [
        ...summarySelect,
        jsonArrayFrom(
          eb
            .selectFrom(AGENT_MCP_TOOLS_KEY)
            .select(agentMcpToolSummarySelect.map(t => `${AGENT_MCP_TOOLS_KEY}.${t}` as const))
            .whereRef(`${AGENT_MCP_TOOLS_KEY}.agentId`, '=', `${AGENTS_MCP_SERVERS_KEY}.agentId`)
            .whereRef(`${AGENT_MCP_TOOLS_KEY}.mcpServerId`, '=', `${AGENTS_MCP_SERVERS_KEY}.mcpServerId`),
        ).as('tools'),
      ])
      .where('agentId', '=', agentId)
      .execute();
  }

  function upsert(values: NewAgentMcpServer) {
    return db
      .insertInto(AGENTS_MCP_SERVERS_KEY)
      .values({
        id: AgentMcpServerId.generate(),
        ...values,
      })
      .onConflict(oc =>
        oc.columns(['agentId', 'mcpServerId', 'organizationId']).doUpdateSet({
          configJson: eb => eb.ref('excluded.configJson'),
        }),
      )
      .returning(['id'])
      .executeTakeFirstOrThrow();
  }

  return {
    list,
    listWithTools,
    upsert,
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
export const detailedSelect = [...summarySelect, 'configJson'] satisfies AgentMcpServerColNames[];

export type DetailedSelectCols = (typeof detailedSelect)[number];
