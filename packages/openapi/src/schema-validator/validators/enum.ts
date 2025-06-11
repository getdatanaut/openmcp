import { LimitExceededError } from '../errors.ts';
import type { Context } from '../types.ts';

export function validateEnum(ctx: Context, values: unknown[]): boolean {
  const errorsCount = ctx.errors.length;

  ctx.path.push('enum');

  ctx.size.enum.totalValues += values.length;
  const existingSize = ctx.size.stringLength;

  for (const value of values) {
    if (typeof value !== 'string') continue;
    ctx.size.stringLength += value.length;
  }

  const added = ctx.size.stringLength - existingSize;

  if (values.length > ctx.limits.enum.single && added > ctx.limits.enum.stringLength) {
    ctx.errors.push(
      new LimitExceededError(
        ctx.path,
        `Total string length exceeds the limit of ${ctx.limits.enum.stringLength} by ${added - ctx.limits.enum.stringLength}`,
      ),
    );
  }

  ctx.path.pop();
  return errorsCount === ctx.errors.length;
}
