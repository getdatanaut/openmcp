import type { TMemberId } from '@libs/db-ids';
import { pgTable, text } from 'drizzle-orm/pg-core';

import { timestampCol } from '../../column-types.ts';
import type { DrizzleToKysely } from '../../types.ts';
import { organizations } from '../organizations/schema.ts';
import { users } from '../users/schema.ts';

export const MEMBERS_KEY = 'members' as const;
export const MEMBERS_TABLE = 'members' as const;

/**
 * IMPORTANT:
 *
 * This table must include the columns required by the better-auth schema. Be careful when making changes.
 * You can verify what better-auth expects by checking out the libs/auth/src/schema.gen.ts file.
 *
 * It is safe to add additional columns beyond what better-auth needs.
 */
export const members = pgTable(MEMBERS_TABLE, {
  id: text('id').$type<TMemberId>().primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  role: text('role').notNull(),
  createdAt: timestampCol('created_at').defaultNow().notNull(),
});

export type MembersTableCols = DrizzleToKysely<typeof members>;
export type Member = typeof members.$inferSelect;
export type MemberColNames = NonNullable<keyof Member>;
