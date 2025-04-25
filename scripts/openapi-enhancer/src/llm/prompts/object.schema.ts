import { z } from 'zod';

export default z.object({
  description: z.string(),
  summary: z.string(),
  'tool-name': z.string(),
  'tool-use-cases': z.array(z.string()),
  purpose: z.string(),
});
