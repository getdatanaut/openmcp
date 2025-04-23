import type { TAgentId, TAgentMcpToolId, TMcpServerId, TMcpToolId, TOrganizationId, TUserId } from '@libs/db-ids';
import type { SetOptional } from '@libs/utils-types';
import { index, pgTable, text } from 'drizzle-orm/pg-core';
import type { Updateable } from 'kysely';

import type { DrizzleToKysely } from '../../types.ts';
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
    index('agent_mcp_tools_agent_id_mcp_tool_id_idx').on(table.agentId, table.mcpToolId),
    index('agent_mcp_tools_agent_id_mcp_server_id_idx').on(table.agentId, table.mcpServerId),
  ],
);

export type AgentMcpToolsTableCols = DrizzleToKysely<typeof agentMcpTools>;
export type NewAgentMcpTool = SetOptional<typeof agentMcpTools.$inferInsert, 'id'>;
export type UpdateableAgentMcpTool = Omit<
  Updateable<AgentMcpToolsTableCols>,
  'id' | 'agentId' | 'mcpServerId' | 'mcpToolId'
>;
export type AgentMcpTool = typeof agentMcpTools.$inferSelect;
export type AgentMcpToolColNames = NonNullable<keyof AgentMcpTool>;

export type AgentMcpToolSummarySelect = Pick<AgentMcpTool, SummarySelectCols>;
export type AgentMcpToolDetailedSelect = Pick<AgentMcpTool, DetailedSelectCols>;
