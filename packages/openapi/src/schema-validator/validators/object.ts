import { OptionalPropertyError } from '../errors.ts';
import type { Context, SchemaWithType } from '../types.ts';
import { validateKeywordValue, validateKeywordValueType, validateValueType } from './common.ts';
import { validateSchema } from './schema.ts';

export function validateObject(ctx: Context, schema: SchemaWithType<'object'>): boolean {
  validateKeywordValue(ctx, schema, 'additionalProperties', false);
  if (!validateKeywordValueType(ctx, schema, 'properties', 'object')) {
    return false;
  }

  const required = new Set<string>();
  if (validateKeywordValueType(ctx, schema, 'required', 'array')) {
    ctx.path.push('required', 0);
    for (const [i, propertyName] of schema.required.entries()) {
      ctx.path[ctx.path.length - 1] = i;
      if (validateValueType(ctx, propertyName, 'string')) {
        required.add(propertyName);
      }
    }

    ctx.path.pop();
    ctx.path.pop();
  }

  const errorsCount = ctx.errors.length;
  const nextDepth = ctx.depth + 1;
  const l = ctx.path.length;
  for (const [propertyName, propertySchema] of Object.entries(schema.properties)) {
    ctx.size.stringLength += propertyName.length;
    ctx.size.propertiesCount++;

    ctx.depth = nextDepth;
    ctx.path.push('properties', propertyName);
    if (!required.has(propertyName)) {
      ctx.errors.push(new OptionalPropertyError(ctx, propertyName));
    }

    validateSchema(ctx, propertySchema);
    ctx.path.length = l;
  }

  ctx.depth = nextDepth - 1;

  return errorsCount === ctx.errors.length;
}
