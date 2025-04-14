import type { TAgentId, TAgentMcpToolId, TMcpServerId, TMcpToolId } from '@libs/db-ids';
import type { SetOptional } from '@libs/utils-types';
import { index, pgTable, text } from 'drizzle-orm/pg-core';
import type { Updateable } from 'kysely';

import type { DrizzleToKysely } from '../../types.ts';
import type { DetailedSelectCols, SummarySelectCols } from './queries.ts';

export const AGENT_MCP_TOOLS_KEY = 'agentMcpTools' as const;
export const AGENT_MCP_TOOLS_TABLE = 'agent_mcp_tools' as const;

export const agentMcpTools = pgTable(
  AGENT_MCP_TOOLS_TABLE,
  {
    id: text('id').$type<TAgentMcpToolId>().primaryKey(),
    agent_id: text('agent_id').$type<TAgentId>().notNull(),
    mcp_server_id: text('mcp_server_id').$type<TMcpServerId>().notNull(),
    mcp_tool_id: text('mcp_tool_id').$type<TMcpToolId>().notNull(),
  },
  table => [
    index('agent_mcp_tools_agent_id_mcp_tool_id_idx').on(table.agent_id, table.mcp_tool_id),
    index('agent_mcp_tools_agent_id_mcp_server_id_idx').on(table.agent_id, table.mcp_server_id),
  ],
);

export type AgentMcpToolsTableCols = DrizzleToKysely<typeof agentMcpTools>;
export type NewMcpTool = SetOptional<typeof agentMcpTools.$inferInsert, 'id'>;
export type UpdateableMcpTool = Omit<
  Updateable<AgentMcpToolsTableCols>,
  'id' | 'agent_id' | 'mcp_server_id' | 'mcp_tool_id'
>;
export type AgentMcpTool = typeof agentMcpTools.$inferSelect;
export type AgentMcpToolColNames = NonNullable<keyof AgentMcpTool>;

export type AgentMcpToolSummarySelect = Pick<AgentMcpTool, SummarySelectCols>;
export type AgentMcpToolDetailedSelect = Pick<AgentMcpTool, DetailedSelectCols>;
