import { McpToolId, type TMcpServerId, type TMcpToolId } from '@libs/db-ids';
import { safeBulkOp } from '@libs/db-pg-client';

import type { BuildQueriesOpts } from '../../types.ts';
import { MCP_TOOLS_KEY, type McpToolColNames, type NewMcpTool } from './schema.ts';

export type McpToolQueries = ReturnType<typeof mcpToolQueries>;

export const mcpToolQueries = ({ db }: BuildQueriesOpts) => {
  function listByServerId({ serverId }: { serverId: TMcpServerId }) {
    return db.selectFrom(MCP_TOOLS_KEY).select(summarySelect).where('mcpServerId', '=', serverId).execute();
  }

  function bulkDeleteById(values: { ids: TMcpToolId[] }) {
    return db.deleteFrom(MCP_TOOLS_KEY).where('id', 'in', values.ids).execute();
  }

  function getById({ id }: { id: TMcpToolId }) {
    return db.selectFrom(MCP_TOOLS_KEY).select(detailedSelect).where('id', '=', id).executeTakeFirst();
  }

  function bulkUpsert(values: NewMcpTool[]) {
    return safeBulkOp(
      values.map(
        v =>
          ({
            id: McpToolId.generate(),
            updatedAt: new Date(),
            ...v,
          }) as const,
      ),
      v =>
        db
          .insertInto(MCP_TOOLS_KEY)
          .values(v)
          .onConflict(oc =>
            oc.columns(['mcpServerId', 'name']).doUpdateSet({
              displayName: eb => eb.ref('excluded.displayName'),
              summary: eb => eb.ref('excluded.summary'),
              description: eb => eb.ref('excluded.description'),
              instructions: eb => eb.ref('excluded.instructions'),
              inputSchemaJson: eb => eb.ref('excluded.inputSchemaJson'),
              outputSchemaJson: eb => eb.ref('excluded.outputSchemaJson'),
              isReadonly: eb => eb.ref('excluded.isReadonly'),
              isDestructive: eb => eb.ref('excluded.isDestructive'),
              isIdempotent: eb => eb.ref('excluded.isIdempotent'),
              isOpenWorld: eb => eb.ref('excluded.isOpenWorld'),
              updatedAt: eb => eb.ref('excluded.updatedAt'),
            }),
          )
          .returning(['id'])
          .execute(),
    );
  }

  return {
    listByServerId,
    getById,
    bulkUpsert,
    bulkDeleteById,
  };
};

/**
 * The values that are returned by default for queries that return a list of records.
 */
export const summarySelect = [
  'id',
  'name',
  'displayName',
  'summary',
  'isReadonly',
  'isDestructive',
  'isIdempotent',
  'isOpenWorld',
  'mcpServerId',
  'createdAt',
  'updatedAt',
] satisfies McpToolColNames[];

export type SummarySelectCols = (typeof summarySelect)[number];

/**
 * The values that are returned by default for queries that return a single record.
 */
export const detailedSelect = [
  ...summarySelect,
  'description',
  'instructions',
  'inputSchemaJson',
  'outputSchemaJson',
] satisfies McpToolColNames[];

export type DetailedSelectCols = (typeof detailedSelect)[number];
