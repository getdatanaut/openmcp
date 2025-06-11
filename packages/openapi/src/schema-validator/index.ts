import { isPlainObject } from '@stoplight/json';

import { InvalidSchemaError } from './errors.ts';
import type { Context } from './types.ts';
import { stringifyValue } from './utils.ts';
import { validateKeywordValue, validateLimits } from './validators/common.ts';
import { validateObject } from './validators/object.ts';

export {
  InvalidDataTypeError,
  InvalidKeywordValueError,
  InvalidSchemaError,
  LimitExceededError,
  MissingKeywordError,
  OptionalPropertyError,
  UnsupportedKeyword,
} from './errors.ts';

const LIMITS = {
  'openai-20250611': {
    totalProperties: 100,
    stringLength: 15_000,
    maxDepth: 5,
    enum: {
      total: 500,
      single: 250,
      stringLength: 7_500,
    },
  },
} as const;

export function validateSchema(value: unknown, provider: keyof typeof LIMITS = 'openai-20250611') {
  if (!isPlainObject(value)) {
    throw new InvalidSchemaError([], `Expected a schema object, got ${stringifyValue(value)}`);
  }

  const ctx = {
    errors: [],
    path: [],
    rootSchema: value,
    validatedRefs: new Set(),
    depth: 0,
    size: {
      enum: {
        totalValues: 0,
        totalStringLength: 0,
      },
      stringLength: 0,
      propertiesCount: 0,
    },
    limits: LIMITS[provider],
  } satisfies Context;

  if (validateKeywordValue(ctx, value, 'type', 'object')) {
    validateObject(ctx, value);
    validateLimits(ctx);
  }

  if (ctx.errors.length === 1) {
    throw ctx.errors[0]!;
  } else if (ctx.errors.length > 1) {
    throw new AggregateError(ctx.errors, 'Invalid schema');
  }
}
