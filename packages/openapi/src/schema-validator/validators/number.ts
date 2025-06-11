import { InvalidSchemaError } from '../errors.ts';
import type { Context, SchemaWithType } from '../types.ts';
import { validateKeywordValueType } from './common.ts';

export function validateNumber(ctx: Context, schema: SchemaWithType<'number' | 'integer'>): boolean {
  const errorsCount = ctx.errors.length;

  for (const keyword of ['minimum', 'exclusiveMinimum', 'maximum', 'exclusiveMaximum'] as const) {
    validateKeywordValueType(ctx, schema, keyword, 'number', true);
  }

  const { minimum, maximum, exclusiveMinimum, exclusiveMaximum, multipleOf } = schema;

  if (typeof multipleOf === 'number' && multipleOf <= 0) {
    ctx.errors.push(new InvalidSchemaError([...ctx.path, 'multipleOf'], 'multipleOf must be greater than 0'));
  }

  if (typeof minimum === 'number' && typeof maximum === 'number' && minimum > maximum) {
    ctx.errors.push(new InvalidSchemaError(ctx.path, 'minimum cannot be greater than maximum'));
  }

  if (typeof exclusiveMinimum === 'number' && typeof maximum === 'number' && exclusiveMinimum >= maximum) {
    ctx.errors.push(new InvalidSchemaError(ctx.path, 'exclusiveMinimum must be less than maximum'));
  }

  if (typeof minimum === 'number' && typeof exclusiveMaximum === 'number' && minimum >= exclusiveMaximum) {
    ctx.errors.push(new InvalidSchemaError(ctx.path, 'minimum must be less than exclusiveMaximum'));
  }

  if (
    typeof exclusiveMinimum === 'number' &&
    typeof exclusiveMaximum === 'number' &&
    exclusiveMinimum >= exclusiveMaximum
  ) {
    ctx.errors.push(new InvalidSchemaError(ctx.path, 'exclusiveMinimum must be less than exclusiveMaximum'));
  }

  return errorsCount === ctx.errors.length;
}
