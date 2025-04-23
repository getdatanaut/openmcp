import type { TOrganizationId, TUserId } from '@libs/db-ids';
import { boolean, index, pgTable, text } from 'drizzle-orm/pg-core';

import { timestampCol } from '../../column-types.ts';
import type { DrizzleToKysely } from '../../types.ts';
import { organizations } from '../organizations/schema.ts';
import type { DetailedSelectCols, SummarySelectCols } from './queries.ts';

export const USERS_KEY = 'users' as const;
export const USERS_TABLE = 'users' as const;

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
export const users = pgTable(
  USERS_TABLE,
  {
    id: text('id').$type<TUserId>().primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    emailVerified: boolean('email_verified').notNull(),
    activeOrganizationId: text('active_organization_id')
      .$type<TOrganizationId>()
      .references(() => organizations.id),
    image: text('image'),
    createdAt: timestampCol('created_at').defaultNow().notNull(),
    updatedAt: timestampCol('updated_at').defaultNow().notNull(),
  },
  table => [index('users_email_idx').on(table.email)],
);

export type UsersTableCols = DrizzleToKysely<typeof users>;
export type User = typeof users.$inferSelect;
export type UserColNames = NonNullable<keyof User>;

export type UserSummarySelect = Pick<User, SummarySelectCols>;
export type UserDetailedSelect = Pick<User, DetailedSelectCols>;
