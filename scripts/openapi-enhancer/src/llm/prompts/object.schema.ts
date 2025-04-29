import { z } from 'zod';

export const output = z.object({
  description: z.string(),
  summary: z.string(),
  'tool-name': z.string(),
  'tool-use-cases': z.array(z.string()),
  purpose: z.string(),
});

export const input = z.object({
  object: z
    .object({
      path: z.string(),
      method: z.string(),
      description: z.string().optional(),
      summary: z.string().optional(),
      deprecated: z.boolean().optional(),
      tags: z.array(z.string()).optional(),
      input: z.unknown(),
      output: z.unknown(),
    })
    .passthrough(),
});
