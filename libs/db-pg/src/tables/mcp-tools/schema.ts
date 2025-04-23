import type { TMcpServerId, TMcpToolId, TOrganizationId } from '@libs/db-ids';
import type { ToolInputSchemaSchema, ToolOutputSchemaSchema } from '@libs/schemas/mcp';
import type { SetOptional } from '@libs/utils-types';
import { relations } from 'drizzle-orm';
import { boolean, jsonb, pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core';
import type { Updateable } from 'kysely';
import type { z } from 'zod';

import { timestampCol } from '../../column-types.ts';
import type { DrizzleToKysely } from '../../types.ts';
import { agentMcpTools } from '../agent-mcp-tools/schema.ts';
import { mcpServers } from '../mcp-servers/schema.ts';
import { organizations } from '../organizations/schema.ts';
import type { DetailedSelectCols, SummarySelectCols } from './queries.ts';

export const MCP_TOOLS_KEY = 'mcpTools' as const;
export const MCP_TOOLS_TABLE = 'mcp_tools' as const;

export const mcpTools = pgTable(
  MCP_TOOLS_TABLE,
  {
    id: text('id').$type<TMcpToolId>().primaryKey(),
    name: text('name').notNull(),
    organizationId: text('organization_id')
      .$type<TOrganizationId>()
      .notNull()
      .references(() => organizations.id),
    displayName: text('display_name'),
    summary: text('summary'),
    description: text('description'),
    instructions: text('instructions'),
    inputSchemaJson: jsonb('input_schema_json').$type<z.infer<typeof ToolInputSchemaSchema>>().notNull().default({}),
    outputSchemaJson: jsonb('output_schema_json').$type<z.infer<typeof ToolOutputSchemaSchema>>().notNull().default({}),
    isReadonly: boolean('is_readonly'),
    isDestructive: boolean('is_destructive'),
    isIdempotent: boolean('is_idempotent'),
    isOpenWorld: boolean('is_open_world'),
    mcpServerId: text('mcp_server_id').$type<TMcpServerId>().notNull(),
    createdAt: timestampCol('created_at').defaultNow().notNull(),
    updatedAt: timestampCol('updated_at').defaultNow().notNull(),
  },
  table => [uniqueIndex('mcp_tools_mcp_server_id_name_unique').on(table.mcpServerId, table.name)],
);

export const mcpToolsRelations = relations(mcpTools, ({ one, many }) => ({
  mcpServer: one(mcpServers, {
    fields: [mcpTools.mcpServerId],
    references: [mcpServers.id],
  }),
  agentMcpTools: many(agentMcpTools),
}));

export type McpToolsTableCols = DrizzleToKysely<typeof mcpTools>;
export type NewMcpTool = SetOptional<typeof mcpTools.$inferInsert, 'id'>;
export type UpdateableMcpTool = Updateable<McpToolsTableCols>;
export type McpTool = typeof mcpTools.$inferSelect;
export type McpToolColNames = NonNullable<keyof McpTool>;

export type McpToolSummarySelect = Pick<McpTool, SummarySelectCols>;
export type McpToolDetailedSelect = Pick<McpTool, DetailedSelectCols>;
