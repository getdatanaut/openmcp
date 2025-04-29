import { TransportSchema } from '@openmcp/schemas/mcp';
import { type } from '@orpc/contract';
import { z } from 'zod';

import { base } from './base.ts';
import { McpClientConfigSchemaSchema, ToolInputSchemaSchema, ToolOutputSchemaSchema } from './schemas.ts';

const uploadContract = base
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
  .output(type<{ id: string }>());

export const mcpServersRouterContract = {
  mcpServers: {
    upload: uploadContract,
  },
};
