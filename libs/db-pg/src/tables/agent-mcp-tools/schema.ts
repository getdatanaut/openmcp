import type { TAgentId, TAgentMcpToolId, TMcpServerId, TMcpToolId, TOrganizationId, TUserId } from '@libs/db-ids';
import type { SetOptional } from '@libs/utils-types';
import { relations } from 'drizzle-orm';
import { pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core';
import type { Updateable } from 'kysely';

import type { DrizzleToKysely } from '../../types.ts';
import { agentMcpServers } from '../agent-mcp-servers/schema.ts';
import { agents } from '../agents/schema.ts';
import { mcpTools } from '../mcp-tools/schema.ts';
import { organizations } from '../organizations/schema.ts';
import type { DetailedSelectCols, SummarySelectCols } from './queries.ts';

export const AGENT_MCP_TOOLS_KEY = 'agentMcpTools' as const;
export const AGENT_MCP_TOOLS_TABLE = 'agent_mcp_tools' as const;

export const agentMcpTools = pgTable(
  AGENT_MCP_TOOLS_TABLE,
  {
    id: text('id').$type<TAgentMcpToolId>().primaryKey(),
    agentId: text('agent_id').$type<TAgentId>().notNull(),
    organizationId: text('organization_id')
      .$type<TOrganizationId>()
      .notNull()
      .references(() => organizations.id),
    createdBy: text('created_by').$type<TUserId>().notNull(),
    mcpServerId: text('mcp_server_id').$type<TMcpServerId>().notNull(),
    mcpToolId: text('mcp_tool_id').$type<TMcpToolId>().notNull(),
  },
  table => [
    uniqueIndex('agent_mcp_tools_agent_id_mcp_server_id_mcp_tool_id_idx').on(
      table.agentId,
      table.mcpServerId,
      table.mcpToolId,
    ),
  ],
);

export const agentMcpToolsRelations = relations(agentMcpTools, ({ one }) => ({
  agent: one(agents, {
    fields: [agentMcpTools.agentId],
    references: [agents.id],
  }),
  agentMcpServer: one(agentMcpServers, {
    fields: [agentMcpTools.agentId, agentMcpTools.mcpServerId],
    references: [agentMcpServers.agentId, agentMcpServers.mcpServerId],
  }),
  mcpTool: one(mcpTools, {
    fields: [agentMcpTools.mcpToolId],
    references: [mcpTools.id],
  }),
}));

export type AgentMcpToolsTableCols = DrizzleToKysely<typeof agentMcpTools>;
export type NewAgentMcpTool = SetOptional<typeof agentMcpTools.$inferInsert, 'id'>;
export type UpdateableAgentMcpTool = Omit<
  Updateable<AgentMcpToolsTableCols>,
  'id' | 'agentId' | 'mcpServerId' | 'mcpToolId' | 'organizationId'
>;
export type AgentMcpTool = typeof agentMcpTools.$inferSelect;
export type AgentMcpToolColNames = NonNullable<keyof AgentMcpTool>;

export type AgentMcpToolSummarySelect = Pick<AgentMcpTool, SummarySelectCols>;
export type AgentMcpToolDetailedSelect = Pick<AgentMcpTool, DetailedSelectCols>;
