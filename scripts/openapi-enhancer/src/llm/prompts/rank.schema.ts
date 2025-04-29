import { z } from 'zod';

export const output = z.object({
  list: z.array(
    z.object({
      purpose: z.string(),
      score: z.number().min(1).max(10),
      reasoning: z.string(),
    }),
  ),
});

export const input = z.object({
  purposes: z.array(z.string()),
});
