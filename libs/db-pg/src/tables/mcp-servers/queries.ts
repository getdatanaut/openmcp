import { McpServerId, type TUserId } from '@libs/db-ids';
import { jsonArrayFrom } from 'kysely/helpers/postgres';

import type { BuildQueriesOpts } from '../../types.ts';
import { summarySelect as toolSummarySelect } from '../mcp-tools/queries.ts';
import { MCP_TOOLS_KEY } from '../mcp-tools/schema.ts';
import { MCP_SERVERS_KEY, type McpServerColNames, type NewMcpServer } from './schema.ts';

export type McpServerQueries = ReturnType<typeof mcpServerQueries>;

export const mcpServerQueries = ({ db }: BuildQueriesOpts) => {
  function list() {
    return db.selectFrom(MCP_SERVERS_KEY).select(summarySelect).where('visibility', '=', 'public');
  }

  function listWithTools() {
    return db
      .selectFrom(MCP_SERVERS_KEY)
      .select(eb => [
        ...summarySelect,
        jsonArrayFrom(
          eb.selectFrom(MCP_TOOLS_KEY).select(toolSummarySelect).whereRef('mcpTools.mcpServerId', '=', 'mcpServers.id'),
        ).as('tools'),
      ])
      .execute();
  }

  function getByExternalId({ userId, externalId }: { userId: TUserId; externalId: string }) {
    return db
      .selectFrom(MCP_SERVERS_KEY)
      .select(detailedSelect)
      .where('userId', '=', userId)
      .where('externalId', '=', externalId)
      .executeTakeFirst();
  }

  function upsert(values: NewMcpServer) {
    return db
      .insertInto(MCP_SERVERS_KEY)
      .values({
        id: McpServerId.generate(),
        updatedAt: new Date(),
        ...values,
      })
      .onConflict(oc =>
        oc.columns(['userId', 'externalId']).doUpdateSet({
          name: eb => eb.ref('excluded.name'),
          summary: eb => eb.ref('excluded.summary'),
          description: eb => eb.ref('excluded.description'),
          instructions: eb => eb.ref('excluded.instructions'),
          iconUrl: eb => eb.ref('excluded.iconUrl'),
          developer: eb => eb.ref('excluded.developer'),
          developerUrl: eb => eb.ref('excluded.developerUrl'),
          sourceUrl: eb => eb.ref('excluded.sourceUrl'),
          configSchema: eb => eb.ref('excluded.configSchema'),
          transport: eb => eb.ref('excluded.transport'),
          runsRemote: eb => eb.ref('excluded.runsRemote'),
          runsLocal: eb => eb.ref('excluded.runsLocal'),
          visibility: eb => eb.ref('excluded.visibility'),
          updatedAt: eb => eb.ref('excluded.updatedAt'),
        }),
      )
      .returning(['id'])
      .executeTakeFirstOrThrow();
  }

  return { list, listWithTools, getByExternalId, upsert };
};

/**
 * The values that are returned by default for queries that return a list of records.
 */
export const summarySelect = [
  'id',
  'externalId',
  'name',
  'iconUrl',
  'summary',
  'runsLocal',
  'runsRemote',
  'createdAt',
  'updatedAt',
] satisfies McpServerColNames[];

export type SummarySelectCols = (typeof summarySelect)[number];

/**
 * The values that are returned by default for queries that return a single record.
 */
export const detailedSelect = [
  ...summarySelect,
  'description',
  'instructions',
  'configSchema',
  'transport',
] satisfies McpServerColNames[];

export type DetailedSelectCols = (typeof detailedSelect)[number];
