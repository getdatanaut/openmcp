import type { TMcpServerId } from '@libs/db-ids';
import type { SetOptional } from '@libs/utils-types';
import { boolean, jsonb, pgTable, text } from 'drizzle-orm/pg-core';
import type { Updateable } from 'kysely';

import { timestampCol } from '../../column-types.ts';
import type { DrizzleToKysely } from '../../types.ts';
import type { DetailedSelectCols, SummarySelectCols } from './queries.ts';

export const MCP_SERVERS_KEY = 'mcpServers' as const;
export const MCP_SERVERS_TABLE = 'mcp_servers' as const;

export const mcpServers = pgTable(MCP_SERVERS_TABLE, {
  id: text('id').$type<TMcpServerId>().primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  instructions: text('instructions'),
  iconUrl: text('icon_url'),
  developer: text('developer').notNull(),
  developerUrl: text('developer_url'),
  sourceUrl: text('source_url'),
  configSchema: jsonb('config_schema').$type<Record<string, unknown>>().notNull().default({}),
  transports: jsonb('transports').$type<Record<string, unknown>>().notNull().default({}),
  runsRemote: boolean('runs_remote').notNull(),
  runsLocal: boolean('runs_local').notNull(),
  createdAt: timestampCol('created_at').defaultNow().notNull(),
  updatedAt: timestampCol('updated_at').defaultNow().notNull(),
});

export type McpServersTableCols = DrizzleToKysely<typeof mcpServers>;
export type NewMcpServer = SetOptional<typeof mcpServers.$inferInsert, 'id'>;
export type UpdateableMcpServer = Updateable<McpServersTableCols>;
export type McpServer = typeof mcpServers.$inferSelect;
export type McpServerColNames = NonNullable<keyof McpServer>;

export type McpServerSummarySelect = Pick<McpServer, SummarySelectCols>;
export type McpServerDetailedSelect = Pick<McpServer, DetailedSelectCols>;
