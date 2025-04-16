import { routerContract } from '@libs/api-contract';
import type { AuthSession, AuthUser } from '@libs/auth/server';
import type { DbSdk } from '@libs/db-pg';
import { implement } from '@orpc/server';

export interface RootContext {
  db: DbSdk;
  user: AuthUser | null;
  session: AuthSession | null;
  r2OpenApiBucket: Env['OPENMCP_OPENAPI'];
}

export const base = implement(routerContract).$context<RootContext>();

export const requireAuth = base.middleware(async ({ context, next, errors }) => {
  if (context.user && context.session) {
    return next({ context: { user: context.user, session: context.session } });
  }

  throw errors.UNAUTHORIZED();
});
