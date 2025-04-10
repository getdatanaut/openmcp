import type { TUserAccountId, TUserId } from '@libs/db-ids';
import { index, pgTable, text } from 'drizzle-orm/pg-core';

import { timestampCol } from '../../column-types.ts';
import type { DrizzleToKysely } from '../../types.ts';
import { users } from '../users/schema.ts';

export const USER_ACCOUNTS_KEY = 'userAccounts' as const;
export const USER_ACCOUNTS_TABLE = 'user_accounts' as const;

/**
 * IMPORTANT:
 *
 * This table must include the columns required by the better-auth schema. Be careful when making changes.
 * You can verify what better-auth expects by checking out the libs/auth/src/schema.gen.ts file.
 *
 * It is safe to add additional columns beyond what better-auth needs.
 */
export const userAccounts = pgTable(
  USER_ACCOUNTS_TABLE,
  {
    id: text('id').$type<TUserAccountId>().primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .$type<TUserId>()
      .notNull()
      // Generally avoiding FK cascades, but better-auth expects this
      .references(() => users.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestampCol('access_token_expires_at'),
    refreshTokenExpiresAt: timestampCol('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestampCol('created_at').defaultNow().notNull(),
    updatedAt: timestampCol('updated_at').defaultNow().notNull(),
  },
  table => [index('user_accounts_user_id_idx').on(table.userId)],
);

export type UserAccountsTableCols = DrizzleToKysely<typeof userAccounts>;
export type UserAccount = typeof userAccounts.$inferSelect;
export type UserAccountColNames = NonNullable<keyof UserAccount>;
