import type { BuildQueriesOpts } from '../../types.ts';

export type UserAccountQueries = ReturnType<typeof userAccountQueries>;

/**
 * Almost everything related to user accounts is managed via the better-auth api
 */
export const userAccountQueries = (_: BuildQueriesOpts) => {
  return {};
};
