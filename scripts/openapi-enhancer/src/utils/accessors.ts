import { isPlainObject } from '@stoplight/json';
import type { Result } from 'option-t/plain_result';
import { createErr, createOk } from 'option-t/plain_result';

class CastError extends TypeError {
  constructor(message: string) {
    super(message);
  }
}

function isPrimitive(value: unknown): value is string | number | boolean | null {
  const typeOf = typeof value;
  return typeOf === 'string' || typeOf === 'number' || typeOf === 'boolean' || value === null;
}

function tryIntoNumber(value: unknown): Result<number, CastError> {
  if (typeof value === 'number') {
    return createOk(value);
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? createErr(new CastError(`Cannot cast ${value} to number`)) : createOk(parsed);
  }

  if (typeof value === 'boolean') {
    return createOk(value ? 1 : 0);
  }

  return createErr(new CastError(`Cannot cast ${value} to number`));
}

function tryIntoBoolean(value: unknown): Result<boolean, CastError> {
  if (typeof value === 'boolean') {
    return createOk(value);
  }

  if (value === 1 || value === '1' || value === 'true') {
    return createOk(true);
  }

  if (value === 0 || value === '0' || value === 'false') {
    return createOk(false);
  }

  return createErr(new CastError(`Cannot cast ${value} to boolean`));
}

export function tryInto<V extends unknown>(
  type: 'string',
  value: V,
): Result<
  V extends string ? V : V extends number ? `${V}` : V extends boolean ? `${V}` : V extends null ? 'null' : string,
  CastError
>;
export function tryInto<V>(
  type: 'number',
  value: V,
): Result<
  V extends number ? V : V extends string ? number : V extends true ? 1 : V extends false ? 0 : never,
  CastError
>;
export function tryInto<V extends boolean>(type: 'boolean', value: V): Result<V, CastError>;
export function tryInto<V>(
  type: 'boolean',
  value: V,
): Result<
  V extends boolean
    ? V
    : V extends 1
      ? true
      : V extends 0
        ? false
        : V extends '1'
          ? true
          : V extends '0'
            ? false
            : V extends 'true'
              ? true
              : V extends 'false'
                ? false
                : never,
  CastError
>;
export function tryInto<V>(type: 'null', value: V): Result<V extends null ? null : never, CastError>;
export function tryInto<V>(type: 'array', value: V): Result<V extends unknown[] ? V : never, CastError>;
export function tryInto<V>(type: 'object', value: V): Result<V extends {} ? V : never, CastError>;
export function tryInto(
  type: 'string' | 'number' | 'boolean' | 'null' | 'array' | 'object',
  value: unknown,
): Result<unknown, CastError> {
  switch (type) {
    case 'string':
      if (isPrimitive(value)) {
        return createOk(String(value));
      }

      break;
    case 'number':
      return tryIntoNumber(value);
    case 'boolean':
      return tryIntoBoolean(value);
    case 'null':
      if (value === null) {
        return createOk(null);
      }

      break;
    case 'array':
      if (Array.isArray(value)) {
        return createOk(value);
      }
      break;
    case 'object':
      if (isPlainObject(value)) {
        return createOk(value);
      }

      break;
  }

  return createErr(new CastError(`Cannot cast ${value} to ${type}`));
}
