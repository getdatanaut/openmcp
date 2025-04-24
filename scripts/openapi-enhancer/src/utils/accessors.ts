import type { Result } from 'option-t/plain_result';
import { createErr, createOk, unwrapOk } from 'option-t/plain_result';

type TypeToValue = {
  string: string;
  number: number;
  boolean: boolean;
  null: null;
  object: Record<string, unknown>;
  array: unknown[];
};

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

export function tryIntoString(value: unknown): Result<string, CastError> {
  return tryInto(value, 'string');
}

export function tryInto<T extends keyof TypeToValue>(value: unknown, type: T): Result<TypeToValue[T], CastError> {
  switch (type) {
    case 'string':
      if (isPrimitive(value)) {
        return createOk(String(value) as TypeToValue[T]);
      }

      break;
    case 'number':
      return tryIntoNumber(value) as Result<TypeToValue[T], CastError>;
    case 'boolean':
      return tryIntoBoolean(value) as Result<TypeToValue[T], CastError>;
    case 'null':
      if (value === null) {
        return createOk(null as TypeToValue[T]);
      }

      break;
    case 'array':
      if (Array.isArray(value)) {
        return createOk(value as TypeToValue[T]);
      }
      break;
    case 'object':
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        return createOk(value as TypeToValue[T]);
      }

      break;
  }

  throw new CastError(`Cannot cast ${value} to ${type}`);
}

export function into<T extends keyof TypeToValue>(value: unknown, type: T): TypeToValue[T] {
  return unwrapOk(tryInto(value, type));
}
