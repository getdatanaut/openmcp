import type { TAgentId, TAgentMcpServerId, TMcpServerId, TOrganizationId, TUserId } from '@libs/db-ids';
import type { SetOptional } from '@libs/utils-types';
import { relations } from 'drizzle-orm';
import { index, jsonb, pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core';
import type { Updateable } from 'kysely';

import type { DrizzleToKysely } from '../../types.ts';
import { agentMcpTools } from '../agent-mcp-tools/schema.ts';
import { agents } from '../agents/schema.ts';
import { mcpServers } from '../mcp-servers/schema.ts';
import { organizations } from '../organizations/schema.ts';
import type { DetailedSelectCols, SummarySelectCols } from './queries.ts';

export const AGENT_MCP_SERVERS_KEY = 'agentMcpServers' as const;
export const AGENT_MCP_SERVERS_TABLE = 'agent_mcp_servers' as const;

export const agentMcpServers = pgTable(
  AGENT_MCP_SERVERS_TABLE,
  {
    id: text('id').$type<TAgentMcpServerId>().primaryKey(),
    agentId: text('agent_id').$type<TAgentId>().notNull(),
    mcpServerId: text('mcp_server_id').$type<TMcpServerId>().notNull(),
    organizationId: text('organization_id')
      .$type<TOrganizationId>()
      .notNull()
      .references(() => organizations.id),
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

export const agentMcpServersRelations = relations(agentMcpServers, ({ one, many }) => ({
  agent: one(agents, {
    fields: [agentMcpServers.agentId],
    references: [agents.id],
  }),
  agentMcpTools: many(agentMcpTools),
  mcpServer: one(mcpServers, {
    fields: [agentMcpServers.mcpServerId],
    references: [mcpServers.id],
  }),
}));

export type AgentMcpServersTableCols = DrizzleToKysely<typeof agentMcpServers>;
export type NewAgentMcpServer = SetOptional<typeof agentMcpServers.$inferInsert, 'id'>;
export type UpdateableAgentMcpServer = Updateable<AgentMcpServersTableCols>;
export type AgentMcpServer = typeof agentMcpServers.$inferSelect;
export type AgentMcpServerColNames = NonNullable<keyof AgentMcpServer>;

export type AgentMcpServerSummarySelect = Pick<AgentMcpServer, SummarySelectCols>;
export type AgentMcpServerDetailedSelect = Pick<AgentMcpServer, DetailedSelectCols>;
