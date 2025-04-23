import type { TOrganizationId } from '@libs/db-ids';
import { pgTable, text } from 'drizzle-orm/pg-core';

import { timestampCol } from '../../column-types.ts';
import type { DrizzleToKysely } from '../../types.ts';

export const ORGANIZATIONS_KEY = 'organizations' as const;
export const ORGANIZATIONS_TABLE = 'organizations' as const;

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
export const organizations = pgTable(ORGANIZATIONS_TABLE, {
  id: text('id').$type<TOrganizationId>().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').unique(),
  logo: text('logo'),
  createdAt: timestampCol('created_at').defaultNow().notNull(),
  metadata: text('metadata'),
});

export type OrganizationsTableCols = DrizzleToKysely<typeof organizations>;
export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
export type OrganizationColNames = NonNullable<keyof Organization>;
