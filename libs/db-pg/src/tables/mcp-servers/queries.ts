import { McpServerId, type TMcpServerId, type TUserId } from '@libs/db-ids';
import type { Expression, SqlBool } from 'kysely';
import { jsonArrayFrom } from 'kysely/helpers/postgres';

import type { BuildQueriesOpts } from '../../types.ts';
import { summarySelect as toolSummarySelect } from '../mcp-tools/queries.ts';
import { MCP_TOOLS_KEY } from '../mcp-tools/schema.ts';
import { MCP_SERVERS_KEY, type McpServerColNames, type NewMcpServer } from './schema.ts';

export type McpServerQueries = ReturnType<typeof mcpServerQueries>;

export const mcpServerQueries = ({ db }: BuildQueriesOpts) => {
  function list({ userId }: { userId?: TUserId } = {}) {
    return db
      .selectFrom(MCP_SERVERS_KEY)
      .select(summarySelect)
      .where(eb => {
        const ors: Expression<SqlBool>[] = [];

        ors.push(eb('visibility', '=', 'public'));

        if (userId) {
          ors.push(eb('userId', '=', userId));
        }

        return eb.or(ors);
      })
      .execute();
  }

  function listWithTools({ userId }: { userId?: TUserId } = {}) {
    return db
      .selectFrom(MCP_SERVERS_KEY)
      .select(eb => [
        ...summarySelect,
        jsonArrayFrom(
          eb
            .selectFrom(MCP_TOOLS_KEY)
            .select(toolSummarySelect.map(t => `${MCP_TOOLS_KEY}.${t}` as const))
            .whereRef(`${MCP_TOOLS_KEY}.mcpServerId`, '=', `${MCP_SERVERS_KEY}.id`),
        ).as('tools'),
      ])
      .where(eb => {
        const ors: Expression<SqlBool>[] = [];

        ors.push(eb('visibility', '=', 'public'));

        if (userId) {
          ors.push(eb('userId', '=', userId));
        }

        return eb.or(ors);
      })
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

  function getById({ id }: { id: TMcpServerId }) {
    return db.selectFrom(MCP_SERVERS_KEY).select(detailedSelect).where('id', '=', id).executeTakeFirst();
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
          configSchemaJson: eb => eb.ref('excluded.configSchemaJson'),
          transportJson: eb => eb.ref('excluded.transportJson'),
          runsRemote: eb => eb.ref('excluded.runsRemote'),
          runsLocal: eb => eb.ref('excluded.runsLocal'),
          visibility: eb => eb.ref('excluded.visibility'),
          toolCount: eb => eb.ref('excluded.toolCount'),
          updatedAt: eb => eb.ref('excluded.updatedAt'),
        }),
      )
      .returning(['id'])
      .executeTakeFirstOrThrow();
  }

  return { list, listWithTools, getByExternalId, getById, upsert };
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
  'toolCount',
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
  'configSchemaJson',
  'transportJson',
] satisfies McpServerColNames[];

export type DetailedSelectCols = (typeof detailedSelect)[number];
