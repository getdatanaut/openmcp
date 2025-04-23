import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

import type { DrizzleToKysely } from '../../types.ts';

export const JWKS_KEY = 'jwks' as const;
export const JWKS_TABLE = 'jwks' as const;

export const jwks = pgTable(JWKS_TABLE, {
  id: text('id').primaryKey(),
  publicKey: text('public_key').notNull(),
  privateKey: text('private_key').notNull(),
  createdAt: timestamp('created_at').notNull(),
});

export type JwksTableCols = DrizzleToKysely<typeof jwks>;
