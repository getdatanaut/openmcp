import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

import { timestampCol } from '../../column-types.ts';
import type { DrizzleToKysely } from '../../types.ts';

export const OAUTH_APPLICATION_KEY = 'oauthApplication' as const;
export const OAUTH_APPLICATION_TABLE = 'oauth_application' as const;

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
  userId: text('user_id'),
  createdAt: timestampCol('created_at'),
  updatedAt: timestampCol('updated_at'),
});

export type OauthApplicationTableCols = DrizzleToKysely<typeof oauthApplication>;
