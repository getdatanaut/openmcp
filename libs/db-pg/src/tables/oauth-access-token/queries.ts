import type { BuildQueriesOpts } from '../../types.ts';

export type OauthAccessTokenQueries = ReturnType<typeof oauthAccessTokenQueries>;

/**
 * Queries for the oauth-access-token table
 */
export const oauthAccessTokenQueries = (_: BuildQueriesOpts) => {
  return {};
};