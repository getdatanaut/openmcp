import type { BuildQueriesOpts } from '../../types.ts';

export type JwksQueries = ReturnType<typeof jwksQueries>;

/**
 * Queries for the jwks table
 */
export const jwksQueries = (_: BuildQueriesOpts) => {
  return {};
};
