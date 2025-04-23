import { routerContract } from '@libs/api-contract';
import type { AuthSession, AuthUser } from '@libs/auth/server';
import type { TOrganizationId } from '@libs/db-ids';
import type { DbSdk } from '@libs/db-pg';
import { implement, onError, ORPCError, ValidationError } from '@orpc/server';
import { ZodError, type ZodIssue } from 'zod';

export interface RootContext {
  db: DbSdk;
  user: AuthUser | null;
  organizationId: TOrganizationId | null;
  session: AuthSession | null;
  r2OpenApiBucket: Env['OPENMCP_OPENAPI'];
}

const root = implement(routerContract).$context<RootContext>();

export const base = root.use(
  onError((error, { errors }) => {
    if (error instanceof ORPCError && error.code === 'BAD_REQUEST' && error.cause instanceof ValidationError) {
      const zodError = new ZodError(error.cause.issues as ZodIssue[]);

      const flattened = zodError.flatten();

      // For some reason zod flatten typing allows for undefined values in the fieldErrors arrays... get rid of those
      const fieldErrors: Record<string, string[]> = {};
      for (const key in flattened.fieldErrors) {
        fieldErrors[key] = flattened.fieldErrors[key] ?? [];
      }

      throw errors.INPUT_VALIDATION_FAILED({
        data: {
          formErrors: flattened.formErrors,
          fieldErrors,
        },
        cause: error.cause,
      });
    }
  }),
);

export const requireAuth = root.middleware(async ({ context, next, errors }) => {
  if (!context.user) {
    throw errors.UNAUTHORIZED();
  }

  if (context.session) {
    if (!context.session.activeOrganizationId) {
      throw errors.UNAUTHORIZED();
    }

    return next({
      context: {
        user: context.user,
        organizationId: context.session.activeOrganizationId as TOrganizationId,
        session: context.session,
      },
    });
  }

  // cli does not have sessions,
  // note this could be potentially inferred from the request if we ever supported dynamic organizations (i.e. in a header or request body)
  const activeOrganizationId = await context.db.queries.users.getActiveOrganizationId({ userId: context.user.id });
  if (!activeOrganizationId) {
    throw errors.UNAUTHORIZED();
  }

  return next({
    context: {
      user: context.user,
      organizationId: activeOrganizationId,
      session: null as AuthSession | null,
    },
  });
});
