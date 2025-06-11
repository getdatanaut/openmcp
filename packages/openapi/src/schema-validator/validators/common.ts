import { isPlainObject } from '@stoplight/json';

import { InvalidDataTypeError, InvalidKeywordValueError, LimitExceededError, MissingKeywordError } from '../errors.ts';
import type { Context, ValueType } from '../types.ts';
import { getValueType } from '../utils.ts';

export function validateDepth(ctx: Context): boolean {
  if (ctx.depth > 5) {
    ctx.errors.push(new LimitExceededError(ctx.path, `Schema exceeds maximum depth of ${ctx.depth}`));
    return false;
  }

  return true;
}

export function validateLimits(ctx: Context): boolean {
  const errorsCount = ctx.errors.length;

  if (ctx.size.stringLength > ctx.limits.stringLength) {
    ctx.errors.push(
      new LimitExceededError(
        ctx.path,
        `Schema exceeds maximum string length of ${ctx.limits.stringLength} by ${ctx.size.stringLength - ctx.limits.stringLength}`,
      ),
    );
  }

  if (ctx.size.propertiesCount > ctx.limits.totalProperties) {
    ctx.errors.push(
      new LimitExceededError(
        ctx.path,
        `Schema exceeds maximum properties count of ${ctx.limits.totalProperties} by ${ctx.size.propertiesCount - ctx.limits.totalProperties}`,
      ),
    );
  }

  if (ctx.size.enum.totalValues > ctx.limits.enum.total) {
    ctx.errors.push(
      new LimitExceededError(
        ctx.path,
        `Schema exceeds maximum enum values count of ${ctx.limits.enum.total} by ${ctx.size.enum.totalValues - ctx.limits.enum.total}`,
      ),
    );
  }

  return errorsCount === ctx.errors.length;
}

export function validateValueType<V extends 'object' | 'array' | 'number' | 'string' | 'boolean' | 'null'>(
  ctx: Context,
  value: unknown,
  expectedType: V,
): value is ValueType<V> {
  let valid = false;

  switch (expectedType) {
    case 'object':
      valid = isPlainObject(value);
      break;
    case 'array':
      valid = Array.isArray(value);
      break;
    case 'null':
      valid = value === null;
      break;
    case 'boolean':
    case 'string':
    case 'number':
      valid = typeof value === expectedType;
  }

  if (!valid) {
    ctx.errors.push(new InvalidDataTypeError(ctx, expectedType, getValueType(value)));
  }

  return valid;
}

export function validateKeywordValue<K extends string, V extends string | boolean>(
  ctx: Context,
  schema: Record<string, unknown>,
  keyword: K,
  value: V,
): schema is { [key in K]: V } & { [key in Exclude<keyof typeof schema, K>]: (typeof schema)[key] } {
  if (!Object.hasOwn(schema, keyword)) {
    ctx.errors.push(new MissingKeywordError(ctx, keyword));
  } else if (schema[keyword] !== value) {
    ctx.errors.push(new InvalidKeywordValueError(ctx, keyword, value));
  } else {
    return true;
  }

  return true;
}

export function validateKeywordValueType<
  K extends string,
  V extends 'object' | 'array' | 'number' | 'string' | 'boolean' | 'null',
>(
  ctx: Context,
  schema: Record<string, unknown>,
  keyword: K,
  value: V,
  optional = false,
): schema is { [key in K]: ValueType<V> } & {
  [key in Exclude<keyof typeof schema, K>]: (typeof schema)[key];
} {
  if (Object.hasOwn(schema, keyword)) {
    return validateValueType(ctx, schema[keyword], value);
  } else if (optional) {
    return false;
  } else {
    ctx.errors.push(new MissingKeywordError(ctx, keyword));
    return false;
  }
}
