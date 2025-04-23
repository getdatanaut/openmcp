import type { TUserId } from '@libs/db-ids';
import { pgTable, text } from 'drizzle-orm/pg-core';

import { timestampCol } from '../../column-types.ts';
import type { DrizzleToKysely } from '../../types.ts';
import { oauthApplication } from '../oauth-application/schema.ts';
import { users } from '../users/schema.ts';

export const OAUTH_ACCESS_TOKEN_KEY = 'oauthAccessToken' as const;
export const OAUTH_ACCESS_TOKEN_TABLE = 'oauth_access_token' as const;

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
export const oauthAccessToken = pgTable(OAUTH_ACCESS_TOKEN_TABLE, {
  id: text('id').primaryKey(),
  accessToken: text('access_token').unique(),
  refreshToken: text('refresh_token').unique(),
  accessTokenExpiresAt: timestampCol('access_token_expires_at').notNull(),
  refreshTokenExpiresAt: timestampCol('refresh_token_expires_at').notNull(),
  clientId: text('client_id')
    .references(() => oauthApplication.clientId, { onDelete: 'cascade' })
    .notNull(),
  userId: text('user_id')
    .$type<TUserId>()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  scopes: text('scopes'),
  createdAt: timestampCol('created_at'),
  updatedAt: timestampCol('updated_at'),
});

export type OauthAccessTokensTableCols = DrizzleToKysely<typeof oauthAccessToken>;
export type OauthAccessToken = typeof oauthAccessToken.$inferSelect;
export type OauthAccessTokenColNames = NonNullable<keyof OauthAccessToken>;
