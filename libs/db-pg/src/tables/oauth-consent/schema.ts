import type { TOauthConsentId, TUserId } from '@libs/db-ids';
import { boolean, pgTable, text } from 'drizzle-orm/pg-core';

import { timestampCol } from '../../column-types.ts';
import type { DrizzleToKysely } from '../../types.ts';

export const OAUTH_CONSENT_KEY = 'oauthConsent' as const;
export const OAUTH_CONSENT_TABLE = 'oauth_consent' as const;

export const oauthConsent = pgTable(OAUTH_CONSENT_TABLE, {
  id: text('id').$type<TOauthConsentId>().primaryKey(),
  clientId: text('client_id'),
  userId: text('user_id').$type<TUserId>().notNull(),
  scopes: text('scopes'),
  createdAt: timestampCol('created_at'),
  updatedAt: timestampCol('updated_at'),
  consentGiven: boolean('consent_given'),
});

export type OauthConsentTableCols = DrizzleToKysely<typeof oauthConsent>;
