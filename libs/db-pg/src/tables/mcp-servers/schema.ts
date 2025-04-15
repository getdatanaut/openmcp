import type { TMcpServerId, TUserId } from '@libs/db-ids';
import type { SetOptional } from '@libs/utils-types';
import { boolean, index, jsonb, pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core';
import type { Updateable } from 'kysely';
import { z } from 'zod';

import { timestampCol } from '../../column-types.ts';
import type { DrizzleToKysely } from '../../types.ts';
import type { DetailedSelectCols, SummarySelectCols } from './queries.ts';

export const MCP_SERVERS_KEY = 'mcpServers' as const;
export const MCP_SERVERS_TABLE = 'mcp_servers' as const;

export const OpenAPITransportSchema = z.object({
  type: z.literal('openapi'),
  serverConfig: z.object({
    openapi: z.string().url(),
    serverUrl: z.string().url(),
  }),
  clientConfig: z
    .object({
      path: z.record(z.unknown()).optional(),
      query: z.record(z.unknown()).optional(),
      headers: z.record(z.unknown()).optional(),
      body: z.record(z.unknown()).optional(),
    })
    .optional(),
});

export type OpenAPITransport = z.infer<typeof OpenAPITransportSchema>;

export const StreamableHTTPTransportSchema = z.object({
  type: z.literal('streamable-http'),
  url: z.string().url(),
  headers: z
    .object({
      'x-openmcp': z.string(),
    })
    .passthrough()
    .optional(),
});

export type StreamableHTTPTransport = z.infer<typeof StreamableHTTPTransportSchema>;

export const SSETransportSchema = z.object({
  type: z.literal('sse'),
  url: z.string().url(),
  headers: z
    .object({
      'x-openmcp': z.string(),
    })
    .passthrough()
    .optional(),
});

export type SSETransport = z.infer<typeof SSETransportSchema>;

export const StdIOTransportSchema = z.object({
  type: z.literal('stdio'),
  command: z.string().nonempty('Command must be provided'),
  args: z.array(z.string()),
});

export type StdIOTransport = z.infer<typeof StdIOTransportSchema>;

export const TransportSchema = z.discriminatedUnion('type', [
  StreamableHTTPTransportSchema,
  SSETransportSchema,
  OpenAPITransportSchema,
  StdIOTransportSchema,
]);

export type Transport = z.infer<typeof TransportSchema>;

export const McpClientConfigSchemaSchema = z.object({
  type: z.literal('object').optional(),
  properties: z
    .record(
      z.object({
        type: z.enum(['string', 'number', 'boolean']),
        title: z.string().optional(),
        description: z.string().optional(),
        default: z.union([z.string(), z.number(), z.boolean()]).optional(),
        enum: z.array(z.string()).optional(),
        format: z.union([z.literal('secret'), z.string()]).optional(),
        example: z.union([z.string(), z.number(), z.boolean()]).optional(),
      }),
    )
    .optional(),
  required: z.array(z.string()).optional(),
});

export type McpClientConfigSchema = z.infer<typeof McpClientConfigSchemaSchema>;

export const mcpServers = pgTable(
  MCP_SERVERS_TABLE,
  {
    id: text('id').$type<TMcpServerId>().primaryKey(),
    externalId: text('external_id').notNull(), // provided by the uploader
    name: text('name').notNull(),
    description: text('description'),
    instructions: text('instructions'),
    iconUrl: text('icon_url'),
    developer: text('developer'),
    developerUrl: text('developer_url'),
    sourceUrl: text('source_url'),
    configSchema: jsonb('config_schema').$type<McpClientConfigSchema>().notNull().default({}),
    transport: jsonb('transport').$type<Transport>().notNull(),
    runsRemote: boolean('runs_remote').default(false).notNull(),
    runsLocal: boolean('runs_local').default(true).notNull(),
    userId: text('user_id').$type<TUserId>().notNull(),
    visibility: text('visibility', { enum: ['public', 'private'] })
      .default('private')
      .notNull(),
    createdAt: timestampCol('created_at').defaultNow().notNull(),
    updatedAt: timestampCol('updated_at').defaultNow().notNull(),
  },
  t => [
    uniqueIndex('mcp_servers_user_id_external_id_unique').on(t.userId, t.externalId),
    index('mcp_servers_visibility_idx').on(t.visibility),
  ],
);

export type McpServersTableCols = DrizzleToKysely<typeof mcpServers>;
export type NewMcpServer = SetOptional<typeof mcpServers.$inferInsert, 'id'>;
export type UpdateableMcpServer = Updateable<McpServersTableCols>;
export type McpServer = typeof mcpServers.$inferSelect;
export type McpServerColNames = NonNullable<keyof McpServer>;

export type McpServerSummarySelect = Pick<McpServer, SummarySelectCols>;
export type McpServerDetailedSelect = Pick<McpServer, DetailedSelectCols>;
