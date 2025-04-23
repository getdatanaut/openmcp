import type { BuildQueriesOpts } from '../../types.ts';

export type MemberQueries = ReturnType<typeof memberQueries>;

/**
 * Almost everything related to members is managed via the better-auth api
 */
export const memberQueries = (_: BuildQueriesOpts) => {
  return {};
};
