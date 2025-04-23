import type { TOauthConsentId, TUserId } from '@libs/db-ids';
import { boolean, pgTable, text } from 'drizzle-orm/pg-core';

import { timestampCol } from '../../column-types.ts';
import type { DrizzleToKysely } from '../../types.ts';
import { oauthApplication } from '../oauth-application/schema.ts';
import { users } from '../users/schema.ts';

export const OAUTH_CONSENT_KEY = 'oauthConsent' as const;
export const OAUTH_CONSENT_TABLE = 'oauth_consent' as const;

/**
 * IMPORTANT:
 *
 * This table must match the better-auth schema. Be careful when making changes.
 * You can verify what better-auth expects by checking out the libs/auth/src/schema.gen.ts file.
 *
 * It is safe to add additional columns beyond what better-auth needs. If you want any of those additional
 * columns to be represented in the better-auth api typings, you can use the `additionalFields` feature to do so.
 *
 * See https://www.better-auth.com/docs/concepts/database#extending-core-schema
 */
export const oauthConsent = pgTable(OAUTH_CONSENT_TABLE, {
  id: text('id').$type<TOauthConsentId>().primaryKey(),
  clientId: text('client_id')
    .notNull()
    .references(() => oauthApplication.clientId, { onDelete: 'cascade' }),
  userId: text('user_id')
    .$type<TUserId>()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  scopes: text('scopes'),
  createdAt: timestampCol('created_at').defaultNow().notNull(),
  updatedAt: timestampCol('updated_at').defaultNow().notNull(),
  consentGiven: boolean('consent_given'),
});

export type OauthConsentsTableCols = DrizzleToKysely<typeof oauthConsent>;
export type OauthConsent = typeof oauthConsent.$inferSelect;
export type OauthConsentColNames = NonNullable<keyof OauthConsent>;
