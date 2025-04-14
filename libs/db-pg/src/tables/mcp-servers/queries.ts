import type { BuildQueriesOpts } from '../../types.ts';
import type { McpServerColNames } from './schema.ts';

export type McpServerQueries = ReturnType<typeof mcpServerQueries>;

export const mcpServerQueries = (_: BuildQueriesOpts) => {
  return {};
};

/**
 * The values that are returned by default for queries that return a list of records.
 */
export const summarySelect = [
  'id',
  'name',
  'icon_url',
  'runs_local',
  'runs_remote',
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
  'config_schema',
  'transports',
] satisfies McpServerColNames[];

export type DetailedSelectCols = (typeof detailedSelect)[number];
