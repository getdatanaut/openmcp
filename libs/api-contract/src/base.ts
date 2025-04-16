import { oc } from '@orpc/contract';
import { z } from 'zod';

export const base = oc.errors({
  UNAUTHORIZED: {},
  BAD_REQUEST: {
    data: z
      .object({
        issues: z.array(
          z.object({
            code: z.string(),
            message: z.string(),
            path: z.array(z.string()),
            validation: z.string(),
          }),
        ),
      })
      .optional(),
  },
});
