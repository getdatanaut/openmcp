import type { TMcpServerId, TOrganizationId, TUserId } from '@libs/db-ids';
import type { McpClientConfigSchemaSchema, TransportSchema } from '@libs/schemas/mcp';
import type { SetOptional } from '@libs/utils-types';
import { relations } from 'drizzle-orm';
import { boolean, index, integer, jsonb, pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core';
import type { Updateable } from 'kysely';
import type { z } from 'zod';

import { timestampCol } from '../../column-types.ts';
import type { DrizzleToKysely } from '../../types.ts';
import { agentMcpServers } from '../agent-mcp-servers/schema.ts';
import { mcpTools } from '../mcp-tools/schema.ts';
import { organizations } from '../organizations/schema.ts';
import { users } from '../users/schema.ts';
import type { DetailedSelectCols, SummarySelectCols } from './queries.ts';

export const MCP_SERVERS_KEY = 'mcpServers' as const;
export const MCP_SERVERS_TABLE = 'mcp_servers' as const;

export const mcpServers = pgTable(
  MCP_SERVERS_TABLE,
  {
    id: text('id').$type<TMcpServerId>().primaryKey(),
    externalId: text('external_id').notNull(), // provided by the uploader
    name: text('name').notNull(),
    summary: text('summary'),
    description: text('description'),
    instructions: text('instructions'),
    iconUrl: text('icon_url'),
    developer: text('developer'),
    developerUrl: text('developer_url'),
    sourceUrl: text('source_url'),
    configSchemaJson: jsonb('config_schema_json')
      .$type<z.infer<typeof McpClientConfigSchemaSchema>>()
      .notNull()
      .default({}),
    transportJson: jsonb('transport_json').$type<z.infer<typeof TransportSchema>>().notNull(),
    runsRemote: boolean('runs_remote').default(false).notNull(),
    runsLocal: boolean('runs_local').default(true).notNull(),
    organizationId: text('organization_id').$type<TOrganizationId>().notNull(),
    createdBy: text('created_by').$type<TUserId>().notNull(),
    toolCount: integer('tool_count').default(0).notNull(),
    visibility: text('visibility', { enum: ['public', 'private'] })
      .default('private')
      .notNull(),
    createdAt: timestampCol('created_at').defaultNow().notNull(),
    updatedAt: timestampCol('updated_at').defaultNow().notNull(),
  },
  t => [
    uniqueIndex('mcp_servers_organization_id_external_id_unique').on(t.organizationId, t.externalId),
    index('mcp_servers_visibility_idx').on(t.visibility),
  ],
);

export const mcpServersRelations = relations(mcpServers, ({ many }) => ({
  mcpTools: many(mcpTools),
  agentMcpServers: many(agentMcpServers),
}));

export type McpServersTableCols = DrizzleToKysely<typeof mcpServers>;
export type NewMcpServer = SetOptional<typeof mcpServers.$inferInsert, 'id'>;
export type UpdateableMcpServer = Updateable<McpServersTableCols>;
export type McpServer = typeof mcpServers.$inferSelect;
export type McpServerColNames = NonNullable<keyof McpServer>;

export type McpServerSummarySelect = Pick<McpServer, SummarySelectCols>;
export type McpServerDetailedSelect = Pick<McpServer, DetailedSelectCols>;
