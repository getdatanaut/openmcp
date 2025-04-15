import { McpServerId, type TUserId } from '@libs/db-ids';

import type { BuildQueriesOpts } from '../../types.ts';
import { MCP_SERVERS_KEY, type McpServerColNames, type NewMcpServer } from './schema.ts';

export type McpServerQueries = ReturnType<typeof mcpServerQueries>;

export const mcpServerQueries = ({ db }: BuildQueriesOpts) => {
  function list() {
    return db.selectFrom(MCP_SERVERS_KEY).select(summarySelect).where('visibility', '=', 'public');
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

  return { list, getByExternalId, upsert };
};

/**
 * The values that are returned by default for queries that return a list of records.
 */
export const summarySelect = [
  'id',
  'externalId',
  'name',
  'iconUrl',
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
  'instructions',
  'configSchema',
  'transport',
] satisfies McpServerColNames[];

export type DetailedSelectCols = (typeof detailedSelect)[number];
