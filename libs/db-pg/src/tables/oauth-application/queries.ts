import { OauthApplicationId } from '@libs/db-ids';

import type { BuildQueriesOpts } from '../../types.ts';
import { OAUTH_APPLICATION_KEY } from './schema.ts';

export type OauthApplicationQueries = ReturnType<typeof oauthApplicationQueries>;

/**
 * Queries for the oauth-application table
 */
export const oauthApplicationQueries = ({ db }: BuildQueriesOpts) => {
  return {
    /**
     * Get client secret by client ID
     * @param clientId The client ID to look up
     * @returns The client secret if found, or null
     */
    getClientSecretByClientId: async (clientId: string) => {
      const result = await db
        .selectFrom(OAUTH_APPLICATION_KEY)
        .select(['clientSecret'])
        .where('clientId', '=', clientId)
        .executeTakeFirst();

      return result?.clientSecret ?? null;
    },

    /**
     * Creates a new OAuth application with specified client ID and a random client secret
     * @param params Parameters for the new OAuth application
     * @returns The created OAuth application including the generated client secret
     */
    createOAuthApplication: async (params: {
      name: string;
      clientId: string;
      clientSecret: string;
      redirectURLs: string[];
      icon?: string;
      metadata?: string;
      type?: string;
      disabled?: boolean;
    }) => {
      const result = await db
        .insertInto(OAUTH_APPLICATION_KEY)
        .values({
          id: OauthApplicationId.generate(),
          name: params.name,
          clientId: params.clientId,
          clientSecret: params.clientSecret,
          redirectURLs: params.redirectURLs.join(','),
          icon: params.icon,
          metadata: params.metadata,
          type: params.type,
          disabled: params.disabled ?? false,
        })
        .returningAll()
        .executeTakeFirst();

      return result;
    },
  };
};
