import type { TUserId } from '@libs/db-ids';
import { pgTable, text } from 'drizzle-orm/pg-core';

import { timestampCol } from '../../column-types.ts';
import type { DrizzleToKysely } from '../../types.ts';

export const OAUTH_ACCESS_TOKEN_KEY = 'oauthAccessToken' as const;
export const OAUTH_ACCESS_TOKEN_TABLE = 'oauth_access_token' as const;

export const oauthAccessToken = pgTable(OAUTH_ACCESS_TOKEN_TABLE, {
  id: text('id').primaryKey(),
  accessToken: text('access_token').unique(),
  refreshToken: text('refresh_token').unique(),
  accessTokenExpiresAt: timestampCol('access_token_expires_at').notNull(),
  refreshTokenExpiresAt: timestampCol('refresh_token_expires_at').notNull(),
  clientId: text('client_id').notNull(),
  userId: text('user_id').$type<TUserId>().notNull(),
  scopes: text('scopes'),
  createdAt: timestampCol('created_at'),
  updatedAt: timestampCol('updated_at'),
});

export type OauthAccessTokenTableCols = DrizzleToKysely<typeof oauthAccessToken>;
