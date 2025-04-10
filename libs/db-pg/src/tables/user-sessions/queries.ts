import type { BuildQueriesOpts } from '../../types.ts';

export type UserSessionQueries = ReturnType<typeof userSessionQueries>;

/**
 * Almost everything related to sessions is managed via the better-auth api
 */
export const userSessionQueries = (_: BuildQueriesOpts) => {
  return {};
};
