import { z } from 'zod';

export const output = z.object({
  description: z.string(),
  summary: z.string(),
  toolName: z.string(),
  toolUseCases: z.array(z.string()),
  purpose: z.string(),
});

export const input = z.object({
  document: z
    .object({
      title: z.string(),
      description: z.string().optional(),
      summary: z.string().optional(),
      version: z.string(),
      contact: z
        .object({
          name: z.string().optional(),
          url: z.string().optional(),
          email: z.string().optional(),
        })
        .optional(),
      license: z
        .object({
          name: z.string().optional(),
          url: z.string().optional(),
        })
        .optional(),
      tags: z.array(z.string()).optional(),
      servers: z.array(z.string()).optional(),
      externalDocs: z.string().optional(),
    })
    .passthrough(),
});
