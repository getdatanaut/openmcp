import { OauthConsentId, type TUserId } from '@libs/db-ids';

import type { BuildQueriesOpts } from '../../types.ts';
import { OAUTH_CONSENT_KEY } from './schema.ts';

export type OauthConsentQueries = ReturnType<typeof oauthConsentQueries>;

/**
 * Queries for the oauth-consent table
 */
export const oauthConsentQueries = ({ db }: BuildQueriesOpts) => {
  function giveConsent({ userId, clientId, scopes }: { userId: TUserId; clientId: string; scopes: string[] }) {
    return db
      .insertInto(OAUTH_CONSENT_KEY)
      .onConflict(oc => oc.columns(['userId', 'clientId']).doNothing())
      .values({
        id: OauthConsentId.generate(),
        userId,
        clientId,
        consentGiven: true,
        scopes: scopes.join(' '),
      })
      .execute();
  }

  return {
    giveConsent,
  };
};
