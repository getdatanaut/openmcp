import type { JsonPath } from '@stoplight/types';

import type { Context } from './types.ts';
import { stringifyValue } from './utils.ts';

export class InvalidSchemaError extends Error {
  fatal = true;
  readonly path: JsonPath;

  constructor(path: JsonPath, message: string) {
    super(message);
    this.path = path.slice();
    this.message = message;
  }
}

export class LimitExceededError extends InvalidSchemaError {
  constructor(path: JsonPath, message: string) {
    super(path, path.length === 0 ? message : `${message} at ${path.join('.')}`);
  }
}

export class MissingKeywordError extends InvalidSchemaError {
  constructor(ctx: Context, keyword: string) {
    super(ctx.path.slice(), `Missing keyword "${keyword}" at ${ctx.path.join('.')}`);
  }
}

export class InvalidDataTypeError extends InvalidSchemaError {
  override readonly fatal = true;

  constructor(ctx: Context, expectedType: string, actualType: string) {
    super(ctx.path, `Expected type "${expectedType}", got "${actualType}" at ${ctx.path.join('.')}`);
  }
}

export class InvalidKeywordValueError extends InvalidSchemaError {
  override readonly fatal = true;

  constructor(ctx: Context, keyword: string, value: unknown) {
    super(
      ctx.path.slice(),
      `Expected keyword "${keyword}" to have value ${stringifyValue(value)}, got ${stringifyValue(value)} at ${ctx.path.join('.')}`,
    );
  }
}

export class OptionalPropertyError extends InvalidSchemaError {
  override readonly fatal = false;

  constructor(ctx: Context, propertyName: string) {
    super(ctx.path.slice(), `Property ${stringifyValue(propertyName)} is optional at ${ctx.path.join('.')}`);
  }
}

export class UnsupportedKeyword extends InvalidSchemaError {
  override readonly fatal = false;

  constructor(ctx: Context, propertyName: string) {
    super(ctx.path.slice(), `Property ${stringifyValue(propertyName)} is optional at ${ctx.path.slice(-1).join('.')}`);
  }
}
