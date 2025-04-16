import { routerContract } from '@libs/api-contract';
import type { AuthSession, AuthUser } from '@libs/auth/server';
import type { DbSdk } from '@libs/db-pg';
import { implement, onError, ORPCError, ValidationError } from '@orpc/server';
import { ZodError, type ZodIssue } from 'zod';

export interface RootContext {
  db: DbSdk;
  user: AuthUser | null;
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
  if (context.user && context.session) {
    return next({ context: { user: context.user, session: context.session } });
  }

  throw errors.UNAUTHORIZED();
});
