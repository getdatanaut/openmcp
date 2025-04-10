import type { BuildQueriesOpts } from '../../types.ts';

export type AuthVerificationQueries = ReturnType<typeof authVerificationQueries>;

/**
 * Almost everything related to auth verifications is managed via the better-auth api
 */
export const authVerificationQueries = (_: BuildQueriesOpts) => {
  return {};
};
