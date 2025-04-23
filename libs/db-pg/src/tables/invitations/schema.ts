import type { TInviteId } from '@libs/db-ids';
import { pgTable, text } from 'drizzle-orm/pg-core';

import { timestampCol } from '../../column-types.ts';
import type { DrizzleToKysely } from '../../types.ts';
import { organizations } from '../organizations/schema.ts';
import { users } from '../users/schema.ts';

export const INVITATIONS_KEY = 'invitations' as const;
export const INVITATIONS_TABLE = 'invitations' as const;

/**
 * IMPORTANT:
 *
 * This table must include the columns required by the better-auth schema. Be careful when making changes.
 * You can verify what better-auth expects by checking out the libs/auth/src/schema.gen.ts file.
 *
 * It is safe to add additional columns beyond what better-auth needs.
 */
export const invitations = pgTable(INVITATIONS_TABLE, {
  id: text('id').$type<TInviteId>().primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  role: text('role'),
  status: text('status').notNull(),
  expiresAt: timestampCol('expires_at').notNull(),
  inviterId: text('inviter_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
});

export type InvitationsTableCols = DrizzleToKysely<typeof invitations>;
export type Invitation = typeof invitations.$inferSelect;
export type InvitationColNames = NonNullable<keyof Invitation>;
