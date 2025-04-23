import type { TAgentId, TAgentMcpServerId, TMcpServerId, TOrganizationId, TUserId } from '@libs/db-ids';
import type { SetOptional } from '@libs/utils-types';
import { index, jsonb, pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core';
import type { Updateable } from 'kysely';

import type { DrizzleToKysely } from '../../types.ts';
import type { DetailedSelectCols, SummarySelectCols } from './queries.ts';

export const AGENTS_MCP_SERVERS_KEY = 'agentsMcpServers' as const;
export const AGENTS_MCP_SERVERS_TABLE = 'agents_mcp_servers' as const;

export const agentsMcpServers = pgTable(
  AGENTS_MCP_SERVERS_TABLE,
  {
    id: text('id').$type<TAgentMcpServerId>().primaryKey(),
    agentId: text('agent_id').$type<TAgentId>().notNull(),
    mcpServerId: text('mcp_server_id').$type<TMcpServerId>().notNull(),
    organizationId: text('organization_id').$type<TOrganizationId>().notNull(),
    createdBy: text('created_by').$type<TUserId>().notNull(),
    configJson: jsonb('config_json').$type<Record<string, unknown>>().notNull().default({}),
  },
  table => [
    uniqueIndex('agents_mcp_servers_agent_id_mcp_server_id_organization_id_idx').on(
      table.agentId,
      table.mcpServerId,
      table.organizationId,
    ),
    index('agents_mcp_servers_organization_id_idx').on(table.organizationId),
  ],
);

export type AgentsMcpServersTableCols = DrizzleToKysely<typeof agentsMcpServers>;
export type NewAgentMcpServer = SetOptional<typeof agentsMcpServers.$inferInsert, 'id'>;
export type UpdateableAgentMcpServer = Updateable<AgentsMcpServersTableCols>;
export type AgentMcpServer = typeof agentsMcpServers.$inferSelect;
export type AgentMcpServerColNames = NonNullable<keyof AgentMcpServer>;

export type AgentMcpServerSummarySelect = Pick<AgentMcpServer, SummarySelectCols>;
export type AgentMcpServerDetailedSelect = Pick<AgentMcpServer, DetailedSelectCols>;
