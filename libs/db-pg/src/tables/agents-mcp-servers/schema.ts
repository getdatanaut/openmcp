import type { TAgentId, TAgentMcpServerId, TMcpServerId, TUserId } from '@libs/db-ids';
import type { SetOptional } from '@libs/utils-types';
import { index, jsonb, pgTable, text } from 'drizzle-orm/pg-core';
import type { Updateable } from 'kysely';

import type { DrizzleToKysely } from '../../types.ts';
import type { agents } from '../agents/schema.ts';
import type { DetailedSelectCols, SummarySelectCols } from './queries.ts';

export const AGENTS_MCP_SERVERS_KEY = 'agents_mcp_servers' as const;
export const AGENTS_MCP_SERVERS_TABLE = 'agents_mcp_servers' as const;

export const agentsMcpServers = pgTable(
  AGENTS_MCP_SERVERS_TABLE,
  {
    id: text('id').$type<TAgentMcpServerId>().primaryKey(),
    agent_id: text('agent_id').$type<TAgentId>().notNull(),
    mcp_server_id: text('mcp_server_id').$type<TMcpServerId>().notNull(),
    user_id: text('user_id').$type<TUserId>().notNull(),
    config: jsonb('config').$type<Record<string, unknown>>().notNull().default({}),
  },
  table => [
    index('agents_mcp_servers_agent_id_mcp_server_id_idx').on(table.agent_id, table.mcp_server_id),
    index('agents_mcp_servers_user_id_idx').on(table.user_id),
  ],
);

export type AgentsMcpServersTableCols = DrizzleToKysely<typeof agentsMcpServers>;
export type NewAgentMcpServer = SetOptional<typeof agents.$inferInsert, 'id'>;
export type UpdateableAgentMcpServer = Updateable<AgentsMcpServersTableCols>;
export type AgentMcpServer = typeof agentsMcpServers.$inferSelect;
export type AgentMcpServerColNames = NonNullable<keyof AgentMcpServer>;

export type AgentMcpServerSummarySelect = Pick<AgentMcpServer, SummarySelectCols>;
export type AgentMcpServerDetailedSelect = Pick<AgentMcpServer, DetailedSelectCols>;
