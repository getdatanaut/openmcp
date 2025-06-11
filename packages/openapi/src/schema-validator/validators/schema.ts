import { isPlainObject, pointerToPath, resolveInlineRef } from '@stoplight/json';

import { InvalidSchemaError } from '../errors.ts';
import type { Context, SchemaWithType } from '../types.ts';
import { stringifyValue } from '../utils.ts';
import { validateAnyOf } from './any-of.ts';
import { validateArray } from './array.ts';
import { validateDepth, validateKeywordValueType } from './common.ts';
import { validateEnum } from './enum.ts';
import { validateNumber } from './number.ts';
import { validateObject } from './object.ts';
import { validateString } from './string.ts';

export function validateSchema(ctx: Context, schema: unknown): boolean {
  if (!isPlainObject(schema)) {
    ctx.errors.push(new InvalidSchemaError(ctx.path, `Expected a schema object, got ${stringifyValue(schema)}`));
    return false;
  }

  validateDepth(ctx);

  const errorsCount = ctx.errors.length;

  if (validateKeywordValueType(ctx, schema, '$ref', 'string', true) && !ctx.validatedRefs.has(schema.$ref)) {
    ctx.validatedRefs.add(schema.$ref);
    try {
      const value = resolveInlineRef(ctx.rootSchema, schema.$ref);
      const { depth, path } = ctx;
      const oldPath = path.slice();
      ctx.depth = 0;
      path.splice(0, path.length - 1, ...pointerToPath(schema.$ref));
      validateSchema(ctx, value);
      path.splice(0, path.length, ...oldPath);
      ctx.depth = depth;
    } catch {
      ctx.errors.push(new InvalidSchemaError([...ctx.path, '$ref'], `Failed to resolve $ref: ${schema.$ref}`));
    }
  }

  switch (schema['type']) {
    case 'object':
      validateObject(ctx, schema as SchemaWithType<'object'>);
      break;
    case 'array':
      validateArray(ctx, schema as SchemaWithType<'array'>);
      break;
    case 'string':
      validateString(ctx, schema as SchemaWithType<'string'>);
      break;
    case 'number':
    case 'integer':
      validateNumber(ctx, schema as SchemaWithType<'number'> | SchemaWithType<'integer'>);
      break;
    case 'boolean':
    case 'null':
      break;
    default:
      ctx.errors.push(new InvalidSchemaError([...ctx.path, 'type'], `Unsupported type: ${schema['type']}`));
      break;
  }

  if (validateKeywordValueType(ctx, schema, 'enum', 'array', true)) {
    validateEnum(ctx, schema.enum);
  }

  if (validateKeywordValueType(ctx, schema, 'anyOf', 'array', true)) {
    validateAnyOf(ctx, schema.anyOf);
  }

  return errorsCount === ctx.errors.length;
}
