import type { BuildQueriesOpts } from '../../types.ts';
import type { McpToolColNames } from './schema.ts';

export type McpToolQueries = ReturnType<typeof mcpToolQueries>;

export const mcpToolQueries = (_: BuildQueriesOpts) => {
  return {};
};

/**
 * The values that are returned by default for queries that return a list of records.
 */
export const summarySelect = [
  'id',
  'name',
  'displayName',
  'description',
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
  'instructions',
  'inputSchema',
  'outputSchema',
] satisfies McpToolColNames[];

export type DetailedSelectCols = (typeof detailedSelect)[number];
