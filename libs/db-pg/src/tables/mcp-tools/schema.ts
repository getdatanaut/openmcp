import type { TMcpServerId, TMcpToolId } from '@libs/db-ids';
import type { SetOptional } from '@libs/utils-types';
import { boolean, jsonb, pgTable, text, unique } from 'drizzle-orm/pg-core';
import type { Updateable } from 'kysely';

import { timestampCol } from '../../column-types.ts';
import type { DrizzleToKysely } from '../../types.ts';
import type { DetailedSelectCols, SummarySelectCols } from './queries.ts';

export const MCP_TOOLS_KEY = 'mcpTools' as const;
export const MCP_TOOLS_TABLE = 'mcp_tools' as const;

export const mcpTools = pgTable(
  MCP_TOOLS_TABLE,
  {
    id: text('id').$type<TMcpToolId>().primaryKey(),
    name: text('name').notNull(),
    displayName: text('display_name'),
    description: text('description').notNull(),
    instructions: text('instructions'),
    inputSchema: jsonb('input_schema').$type<Record<string, unknown>>().notNull().default({}),
    outputSchema: jsonb('output_schema').$type<Record<string, unknown> | null>(),
    isReadonly: boolean('is_readonly'),
    isDestructive: boolean('is_destructive'),
    isIdempotent: boolean('is_idempotent'),
    isOpenWorld: boolean('is_open_world'),
    mcpServerId: text('mcp_server_id').$type<TMcpServerId>().notNull(),
    createdAt: timestampCol('created_at').defaultNow().notNull(),
    updatedAt: timestampCol('updated_at').defaultNow().notNull(),
  },
  table => [unique('mcp_tools_mcp_server_id_name_unique').on(table.mcpServerId, table.name)],
);

export type McpToolsTableCols = DrizzleToKysely<typeof mcpTools>;
export type NewMcpTool = SetOptional<typeof mcpTools.$inferInsert, 'id'>;
export type UpdateableMcpTool = Updateable<McpToolsTableCols>;
export type McpTool = typeof mcpTools.$inferSelect;
export type McpToolColNames = NonNullable<keyof McpTool>;

export type McpToolSummarySelect = Pick<McpTool, SummarySelectCols>;
export type McpToolDetailedSelect = Pick<McpTool, DetailedSelectCols>;
