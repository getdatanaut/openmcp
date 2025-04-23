import type { TAgentId, TOrganizationId, TUserId } from '@libs/db-ids';
import type { SetOptional } from '@libs/utils-types';
import { relations } from 'drizzle-orm';
import { index, pgTable, text } from 'drizzle-orm/pg-core';
import type { Updateable } from 'kysely';

import { timestampCol } from '../../column-types.ts';
import type { DrizzleToKysely } from '../../types.ts';
import { agentMcpServers } from '../agent-mcp-servers/schema.ts';
import type { DetailedSelectCols, SummarySelectCols } from './queries.ts';

export const AGENTS_KEY = 'agents' as const;
export const AGENTS_TABLE = 'agents' as const;

export const agents = pgTable(
  AGENTS_TABLE,
  {
    id: text('id').$type<TAgentId>().primaryKey(),
    name: text('name').notNull(),
    instructions: text('instructions'),
    organizationId: text('organization_id').$type<TOrganizationId>().notNull(),
    createdBy: text('created_by').$type<TUserId>().notNull(),
    createdAt: timestampCol('created_at').defaultNow().notNull(),
    updatedAt: timestampCol('updated_at').defaultNow().notNull(),
  },
  table => [index('agents_organization_id_idx').on(table.organizationId)],
);

export const agentsRelations = relations(agents, ({ many }) => ({
  agentMcpServers: many(agentMcpServers),
}));

export type AgentsTableCols = DrizzleToKysely<typeof agents>;
export type NewAgent = SetOptional<typeof agents.$inferInsert, 'id'>;
export type UpdateableMcpTool = Updateable<AgentsTableCols>;
export type Agent = typeof agents.$inferSelect;
export type AgentColNames = NonNullable<keyof Agent>;

export type AgentSummarySelect = Pick<Agent, SummarySelectCols>;
export type AgentDetailedSelect = Pick<Agent, DetailedSelectCols>;
