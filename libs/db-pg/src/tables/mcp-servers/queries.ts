import type { BuildQueriesOpts } from '../../types.ts';
import { MCP_SERVERS_KEY, type McpServerColNames } from './schema.ts';

export type McpServerQueries = ReturnType<typeof mcpServerQueries>;

export const mcpServerQueries = ({ db }: BuildQueriesOpts) => {
  function list() {
    return db.selectFrom(MCP_SERVERS_KEY).select(summarySelect);
  }

  return { list };
};

/**
 * The values that are returned by default for queries that return a list of records.
 */
export const summarySelect = [
  'id',
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
  'transports',
] satisfies McpServerColNames[];

export type DetailedSelectCols = (typeof detailedSelect)[number];
