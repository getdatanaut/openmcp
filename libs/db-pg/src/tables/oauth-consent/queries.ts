import type { BuildQueriesOpts } from '../../types.ts';

export type OauthConsentQueries = ReturnType<typeof oauthConsentQueries>;

/**
 * Queries for the oauth-consent table
 */
export const oauthConsentQueries = (_: BuildQueriesOpts) => {
  return {};
};