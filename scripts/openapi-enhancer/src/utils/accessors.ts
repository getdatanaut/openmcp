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

export function tryInto<V extends string>(value: V, type: 'string'): Result<V, CastError>;
export function tryInto(value: unknown, type: 'string'): Result<string, CastError>;
export function tryInto<V extends number>(value: V, type: 'number'): Result<V, CastError>;
export function tryInto(value: unknown, type: 'number'): Result<number, CastError>;
export function tryInto<V extends boolean>(value: V, type: 'boolean'): Result<V, CastError>;
export function tryInto(value: unknown, type: 'boolean'): Result<boolean, CastError>;
export function tryInto<V extends null>(value: V, type: 'null'): Result<V, CastError>;
export function tryInto(value: unknown, type: 'null'): Result<null, CastError>;
export function tryInto<V extends unknown[]>(value: V, type: 'array'): Result<V, CastError>;
export function tryInto(value: unknown, type: 'array'): Result<unknown[], CastError>;
export function tryInto<V extends {}>(value: V, type: 'object'): Result<V, CastError>;
export function tryInto(value: unknown, type: 'object'): Result<{}, CastError>;
export function tryInto<V>(
  value: V,
  type: 'string' | 'number' | 'boolean' | 'null' | 'array' | 'object',
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

  throw new CastError(`Cannot cast ${value} to ${type}`);
}

export function tryIntoString<T>(value: T) {
  return tryInto(value, 'string');
}

export function tryIntoArray<T extends unknown[]>(value: T): Result<T, CastError>;
export function tryIntoArray(value: unknown): Result<unknown, CastError>;
export function tryIntoArray<T>(value: T) {
  return tryInto(value, 'array');
}
