import type { TUserId, TUserSessionId } from '@libs/db-ids';
import { index, pgTable, text } from 'drizzle-orm/pg-core';

import { timestampCol } from '../../column-types.ts';
import type { DrizzleToKysely } from '../../types.ts';
import { users } from '../users/schema.ts';

export const USER_SESSIONS_KEY = 'userSessions' as const;
export const USER_SESSIONS_TABLE = 'user_sessions' as const;

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
export const userSessions = pgTable(
  USER_SESSIONS_TABLE,
  {
    id: text('id').$type<TUserSessionId>().primaryKey(),

    token: text('token').notNull().unique(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .$type<TUserId>()
      .notNull()
      // Generally avoiding FK cascades, but better-auth expects this
      .references(() => users.id, { onDelete: 'cascade' }),

    expiresAt: timestampCol('expires_at').notNull(),
    createdAt: timestampCol('created_at').defaultNow().notNull(),
    updatedAt: timestampCol('updated_at').defaultNow().notNull(),
  },
  table => [index('user_sessions_user_id_idx').on(table.userId), index('user_sessions_token_idx').on(table.token)],
);

export type UserSessionsTableCols = DrizzleToKysely<typeof userSessions>;
export type UserSession = typeof userSessions.$inferSelect;
export type UserSessionColNames = NonNullable<keyof UserSession>;
