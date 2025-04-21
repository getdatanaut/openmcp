import type { BuildQueriesOpts } from '../../types.ts';
import { OAUTH_ACCESS_TOKEN_KEY } from './schema.ts';

export type OauthAccessTokenQueries = ReturnType<typeof oauthAccessTokenQueries>;

/**
 * Queries for the oauth-access-token table
 */
export const oauthAccessTokenQueries = ({ db }: BuildQueriesOpts) => {
  return {
    /**
     * Gets a record from the oauth-access-token table by the access token
     * @param accessToken The access token to query
     * @returns The record if found, null otherwise
     */
    getByAccessToken: async (accessToken: string) => {
      const result = await db
        .selectFrom(OAUTH_ACCESS_TOKEN_KEY)
        .selectAll()
        .where('accessToken', '=', accessToken)
        .executeTakeFirst();

      return result || null;
    },
  };
};
