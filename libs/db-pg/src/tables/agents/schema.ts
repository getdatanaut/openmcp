import type { TAgentId, TUserId } from '@libs/db-ids';
import type { SetOptional } from '@libs/utils-types';
import { index, pgTable, text } from 'drizzle-orm/pg-core';
import type { Updateable } from 'kysely';

import { timestampCol } from '../../column-types.ts';
import type { DrizzleToKysely } from '../../types.ts';
import type { DetailedSelectCols, SummarySelectCols } from './queries.ts';

export const AGENTS_KEY = 'agents' as const;
export const AGENTS_TABLE = 'agents' as const;

export const agents = pgTable(
  AGENTS_TABLE,
  {
    id: text('id').$type<TAgentId>().primaryKey(),
    name: text('name').notNull(),
    instructions: text('instructions'),
    user_id: text('user_id').$type<TUserId>().notNull(),
    createdAt: timestampCol('created_at').defaultNow().notNull(),
    updatedAt: timestampCol('updated_at').defaultNow().notNull(),
  },
  table => [index('agents_user_id_idx').on(table.user_id)],
);

export type AgentsTableCols = DrizzleToKysely<typeof agents>;
export type NewMcpTool = SetOptional<typeof agents.$inferInsert, 'id'>;
export type UpdateableMcpTool = Updateable<AgentsTableCols>;
export type Agent = typeof agents.$inferSelect;
export type AgentColNames = NonNullable<keyof Agent>;

export type AgentSummarySelect = Pick<Agent, SummarySelectCols>;
export type AgentDetailedSelect = Pick<Agent, DetailedSelectCols>;
