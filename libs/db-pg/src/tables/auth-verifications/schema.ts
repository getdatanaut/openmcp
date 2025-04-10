import type { TAuthVerificationId } from '@libs/db-ids';
import { index, pgTable, text } from 'drizzle-orm/pg-core';

import { timestampCol } from '../../column-types.ts';
import type { DrizzleToKysely } from '../../types.ts';

export const AUTH_VERIFICATIONS_KEY = 'authVerifications' as const;
export const AUTH_VERIFICATIONS_TABLE = 'auth_verifications' as const;

/**
 * IMPORTANT:
 *
 * This table must include the columns required by the better-auth schema. Be careful when making changes.
 * You can verify what better-auth expects by checking out the libs/auth/src/schema.gen.ts file.
 *
 * It is safe to add additional columns beyond what better-auth needs.
 */
export const authVerifications = pgTable(
  AUTH_VERIFICATIONS_TABLE,
  {
    id: text('id').$type<TAuthVerificationId>().primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestampCol('expires_at').notNull(),
    createdAt: timestampCol('created_at').defaultNow().notNull(),
    updatedAt: timestampCol('updated_at').defaultNow().notNull(),
  },
  table => [index('auth_verifications_identifier_idx').on(table.identifier)],
);

export type AuthVerificationsTableCols = DrizzleToKysely<typeof authVerifications>;
export type AuthVerification = typeof authVerifications.$inferSelect;
export type AuthVerificationColNames = NonNullable<keyof AuthVerification>;
