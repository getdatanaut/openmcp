import type { AuthSession, AuthUser } from '@libs/auth/server';
import type { DbSdk } from '@libs/db-pg';
import { os } from '@orpc/server';
import { z } from 'zod';

export interface RootContext {
  db: DbSdk;
  user: AuthUser | null;
  session: AuthSession | null;
  r2OpenApiBucket: Env['OPENMCP_OPENAPI'];
}

export const base = os.$context<RootContext>().errors({
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

export const requireAuth = base.middleware(async ({ context, next, errors }) => {
  if (context.user && context.session) {
    return next({ context: { user: context.user, session: context.session } });
  }

  throw errors.UNAUTHORIZED();
});
