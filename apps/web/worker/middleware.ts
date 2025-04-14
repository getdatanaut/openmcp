import type { AuthSession, AuthUser } from '@libs/auth/server';
import type { DbSdk } from '@libs/db-pg';
import { ORPCError, os } from '@orpc/server';

export interface RootContext {
  db: DbSdk;
  user: AuthUser | null;
  session: AuthSession | null;
}

export const base = os.$context<RootContext>();

export const requireAuth = base.middleware(async ({ context, next }) => {
  if (context.user && context.session) {
    return next({ context: { user: context.user, session: context.session } });
  }

  throw new ORPCError('UNAUTHORIZED');
});
