import { InvalidSchemaError } from '../errors.ts';
import type { Context } from '../types.ts';
import { validateKeywordValueType } from './common.ts';
import { validateSchema } from './schema.ts';

export function validateArray(ctx: Context, value: { type: 'array'; [key: string]: unknown }): boolean {
  const errorsCount = ctx.errors.length;
  if (validateKeywordValueType(ctx, value, 'items', 'object')) {
    const length = ctx.path.push('items');
    validateSchema(ctx, value.items);
    ctx.path.length = length;
  }

  let minItems = 0;
  if (validateKeywordValueType(ctx, value, 'minItems', 'number', true)) {
    minItems = Math.max(0, minItems);
    if (value.minItems < 0) {
      ctx.errors.push(new InvalidSchemaError([...ctx.path, 'minItems'], '"minItems" must be greater than 0'));
    }
  }

  if (validateKeywordValueType(ctx, value, 'maxItems', 'number') && value.maxItems < minItems) {
    ctx.errors.push(new InvalidSchemaError([...ctx.path, 'maxItems'], '"maxItems" must be greater than "minItems"'));
  }

  return errorsCount === ctx.errors.length;
}
