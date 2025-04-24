import { AgentId, type TAgentId, type TOrganizationId } from '@libs/db-ids';

import type { BuildQueriesOpts } from '../../types.ts';
import { AGENT_MCP_SERVERS_KEY } from '../agent-mcp-servers/schema.ts';
import { AGENT_MCP_TOOLS_KEY } from '../agent-mcp-tools/schema.ts';
import { MCP_SERVERS_KEY } from '../mcp-servers/schema.ts';
import { MCP_TOOLS_KEY } from '../mcp-tools/schema.ts';
import { type AgentColNames, AGENTS_KEY, type NewAgent } from './schema.ts';

export type AgentQueries = ReturnType<typeof agentQueries>;

export const agentQueries = ({ db }: BuildQueriesOpts) => {
  function getById({ id }: { id: TAgentId }) {
    return db.selectFrom(AGENTS_KEY).select(detailedSelect).where('id', '=', id).executeTakeFirst();
  }

  function list({ organizationId, name }: { organizationId: TOrganizationId; name?: string }) {
    const organizationIdCondition = ['organizationId', '=', organizationId] as const;
    return db
      .selectFrom(AGENTS_KEY)
      .select(summarySelect)
      .where(eb =>
        name ? eb.and([eb(...organizationIdCondition), eb('name', '=', `${name}`)]) : eb(...organizationIdCondition),
      )
      .execute();
  }

  async function orderedListWithDependencies({ agentId }: { agentId: TAgentId }) {
    return db
      .selectFrom(AGENTS_KEY)
      .innerJoin(`${AGENT_MCP_SERVERS_KEY} as ams`, join => join.onRef(`ams.agentId`, '=', `${AGENTS_KEY}.id`))
      .innerJoin(`${MCP_SERVERS_KEY} as ms`, join => join.onRef(`ms.id`, '=', `ams.mcpServerId`))
      .innerJoin(`${AGENT_MCP_TOOLS_KEY} as amt`, join => join.onRef(`amt.agentId`, '=', `${AGENTS_KEY}.id`))
      .innerJoin(`${MCP_TOOLS_KEY} as mt`, join => join.onRef(`mt.id`, '=', `amt.mcpToolId`))
      .select([
        'ams.configJson as config',
        'ms.id as serverId',
        'ms.name as serverName',
        'ms.transportJson as transport',
        'mt.name as toolName',
      ])
      .where(`${AGENTS_KEY}.id`, '=', agentId)
      .orderBy('ms.id')
      .orderBy('mt.name')
      .execute();
  }

  function create(values: NewAgent) {
    return db
      .insertInto(AGENTS_KEY)
      .values({
        id: AgentId.generate(),
        ...values,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  return {
    getById,
    orderedListWithDependencies,
    list,
    create,
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
