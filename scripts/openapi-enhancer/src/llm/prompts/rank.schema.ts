import { z } from 'zod';

export default z.object({
  list: z.array(
    z.object({
      purpose: z.string(),
      score: z.number().min(1).max(10),
      reasoning: z.string(),
    }),
  ),
});
