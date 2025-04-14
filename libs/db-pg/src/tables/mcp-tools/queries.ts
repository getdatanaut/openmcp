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
  'display_name',
  'description',
  'is_readonly',
  'is_destructive',
  'is_idempotent',
  'is_open_world',
  'mcp_server_id',
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
  'input_schema',
  'output_schema',
] satisfies McpToolColNames[];

export type DetailedSelectCols = (typeof detailedSelect)[number];
