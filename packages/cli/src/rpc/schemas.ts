import { z } from 'zod';

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

export const ToolInputSchemaSchema = z
  .object({
    type: z.literal('object').optional(),
    properties: z.optional(z.object({}).passthrough()),
  })
  .passthrough();

export const ToolOutputSchemaSchema = z
  .object({
    type: z.string().optional(),
    properties: z.optional(z.object({}).passthrough()),
  })
  .passthrough();
