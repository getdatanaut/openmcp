import { McpServerId, type TMcpServerId } from '@libs/db-ids';
import {
  McpClientConfigSchemaSchema,
  ToolInputSchemaSchema,
  ToolOutputSchemaSchema,
  TransportSchema,
} from '@libs/schemas/mcp';
import { type } from '@orpc/contract';
import { z } from 'zod';

import { base } from './base.ts';

const uploadContract = base
  .route({ method: 'PUT', path: '/mcp-servers/{externalId}' })
  .input(
    z.object({
      name: z.string(),
      externalId: z.string().min(2).max(255),
      summary: z.string().optional(),
      description: z.string().optional(),
      instructions: z.string().optional(),
      iconUrl: z.string().url().optional(),
      developer: z.string().optional(),
      developerUrl: z.string().url().optional(),
      sourceUrl: z.string().url().optional(),
      configSchema: McpClientConfigSchemaSchema.optional(),
      transport: TransportSchema,
      visibility: z.enum(['public', 'private']).optional(),
      tools: z
        .array(
          z.object({
            name: z.string(),
            displayName: z.string().optional(),
            summary: z.string().optional(),
            description: z.string().optional(),
            instructions: z.string().optional(),
            inputSchema: ToolInputSchemaSchema.optional(),
            outputSchema: ToolOutputSchemaSchema.optional(),
            isReadonly: z.boolean().optional(),
            isDestructive: z.boolean().optional(),
            isIdempotent: z.boolean().optional(),
            isOpenWorld: z.boolean().optional(),
          }),
        )
        .default([]),
    }),
  )
  .output(type<{ id: TMcpServerId }>());

const uploadFromOpenApiContract = base
  .input(
    z.object({
      name: z.string().optional(),
      externalId: z.string().min(2).max(255).optional(),
      openapi: z.string().url(),
      serverUrl: z.string().url().optional(),
      iconUrl: z.string().url().optional(),
      developer: z.string().optional(),
      developerUrl: z.string().url().optional(),
      sourceUrl: z.string().url().optional(),
      configSchema: McpClientConfigSchemaSchema.optional(),
      visibility: z.enum(['public', 'private']).optional(),
    }),
  )
  .output(type<{ id: TMcpServerId }>());

const getOpenApiDocumentContract = base
  .route({
    method: 'GET',
    path: '/mcp-servers/{serverId}/openapi',
    outputStructure: 'detailed',
  })
  .errors({ NOT_FOUND: {} })
  .input(z.object({ serverId: McpServerId.validator }))
  .output(type<{ body: Blob }>());

export const mpcServersRouterContract = {
  mcpServers: {
    upload: uploadContract,
    uploadFromOpenApi: uploadFromOpenApiContract,
    getOpenApiDocument: getOpenApiDocumentContract,
  },
};
