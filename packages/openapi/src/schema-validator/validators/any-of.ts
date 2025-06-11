import type { Context } from '../types.ts';
import { validateSchema } from './schema.ts';

export function validateAnyOf(ctx: Context, anyOf: unknown[]): boolean {
  const errorsCount = ctx.errors.length;

  for (const elem of anyOf) {
    validateSchema(ctx, elem);
  }

  return errorsCount === ctx.errors.length;
}
