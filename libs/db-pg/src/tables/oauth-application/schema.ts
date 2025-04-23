import type { TUserId } from '@libs/db-ids';
import { boolean, pgTable, text } from 'drizzle-orm/pg-core';

import { timestampCol } from '../../column-types.ts';
import type { DrizzleToKysely } from '../../types.ts';

export const OAUTH_APPLICATION_KEY = 'oauthApplication' as const;
export const OAUTH_APPLICATION_TABLE = 'oauth_application' as const;

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
export const oauthApplication = pgTable(OAUTH_APPLICATION_TABLE, {
  id: text('id').primaryKey(),
  name: text('name'),
  icon: text('icon'),
  metadata: text('metadata'),
  clientId: text('client_id').unique(),
  clientSecret: text('client_secret'),
  redirectURLs: text('redirect_u_r_ls'),
  type: text('type'),
  disabled: boolean('disabled'),
  userId: text('user_id').$type<TUserId>(),
  createdAt: timestampCol('created_at'),
  updatedAt: timestampCol('updated_at'),
});

export type OauthApplicationsTableCols = DrizzleToKysely<typeof oauthApplication>;
export type OauthApplication = typeof oauthApplication.$inferSelect;
export type OauthApplicationColNames = NonNullable<keyof OauthApplication>;
