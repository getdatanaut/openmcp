import { describe, expect, it } from 'vitest';

import { InvalidSchemaError, LimitExceededError, validateSchema } from '../src/schema-validator/index.ts';

describe('validateSchema', () => {
  it('should validate a valid schema', async () => {
    const { default: schema } = await import('./__fixtures__/schema-validator/valid-schema.json');
    expect(() => validateSchema(schema)).not.toThrow();
  });

  it('should throw when schema is not an object', async () => {
    const { default: schema } = await import('./__fixtures__/schema-validator/invalid-schema-not-object.json');
    expect(() => validateSchema(schema)).toThrow(InvalidSchemaError);
    expect(() => validateSchema(schema)).toThrow('Expected a schema object');
  });

  it('should throw when schema is not an object', async () => {
    const { default: schema } = await import('./__fixtures__/schema-validator/invalid-schema-wrong-type.json');
    expect(() => validateSchema(schema)).toThrow(AggregateError);
  });

  describe('enum limits', () => {
    it('should throw if schema has more than 500 enum values', async () => {
      const schema = {
        type: 'object',
        additionalProperties: false,
        required: ['enum1', 'enum2', 'enum3'],
        properties: {
          enum1: {
            type: 'string',
            enum: [...new Array(100)].map((_, i) => `enumValue${i}`),
          },
          enum2: {
            type: 'string',
            enum: [...new Array(200)].map((_, i) => `enumValue${i}`),
          },
          enum3: {
            type: 'string',
            enum: [...new Array(201)].map((_, i) => `enumValue${i}`),
          },
        },
      };

      expect(() => validateSchema(schema)).toThrow(
        new LimitExceededError([], 'Schema exceeds maximum enum values count of 500 by 1'),
      );
    });

    it('should validate a schema with enum values at the limit', async () => {
      const schema = {
        type: 'object',
        additionalProperties: false,
        required: ['enumProperty'],
        properties: {
          enumProperty: {
            type: 'string',
            enum: [...new Array(500)].map((_, i) => `enumValue${i}`),
          },
        },
      };

      expect(() => validateSchema(schema)).not.toThrow();
    });

    it('should throw when enum has more than 250 values and string length limit is exceeded', () => {
      const str = ' '.repeat(35);
      const schema = {
        type: 'object',
        additionalProperties: false,
        required: ['enumProperty'],
        properties: {
          enumProperty: {
            type: 'string',
            enum: [...new Array(251)].map(() => str),
          },
        },
      };

      expect(() => validateSchema(schema)).toThrow(
        new LimitExceededError(
          ['properties', 'enumProperty', 'enum'],
          'Total string length exceeds the limit of 7500 by 1285',
        ),
      );
    });

    it('should throw when enum has 250 values and the global string length limit is not exceeded', () => {
      const str = ' '.repeat(35);
      const schema = {
        type: 'object',
        additionalProperties: false,
        required: ['enumProperty'],
        properties: {
          enumProperty: {
            type: 'string',
            enum: [...new Array(250)].map(() => str),
          },
        },
      };

      expect(() => validateSchema(schema)).not.toThrow();
    });
  });

  describe('string limits', () => {
    it('should throw when schema exceeds depth limit', async () => {
      const { default: schema } = await import('./__fixtures__/schema-validator/invalid-schema-depth-exceeded.json');
      expect(() => validateSchema(schema)).toThrow(AggregateError);
    });

    it('should throw when schema exceeds property count limit', async () => {
      const { default: schema } = await import(
        './__fixtures__/schema-validator/invalid-schema-property-count-exceeded.json'
      );
      expect(() => validateSchema(schema)).toThrow(AggregateError);
    });

    it('should throw when schema exceeds string length limit', () => {
      const generateLongString = (length: number) => 'a'.repeat(length);
      const lengthyProp1 = generateLongString(10000);

      const schema = {
        type: 'object',
        additionalProperties: false,
        required: [lengthyProp1, 'test'],
        properties: {
          [lengthyProp1]: {
            type: 'string',
          },
          test: {
            type: 'string',
            enum: [generateLongString(1000), generateLongString(5000)],
          },
        },
      };

      expect(() => validateSchema(schema)).toThrow(
        new LimitExceededError([], `Schema exceeds maximum string length of 15000 by 1004`),
      );
    });
  });

  it('should throw when schema is null', () => {
    expect(() => validateSchema(null)).toThrow(new InvalidSchemaError([], 'Expected a schema object, got null'));
  });

  it('should throw when schema is undefined', () => {
    expect(() => validateSchema(undefined)).toThrow(
      new InvalidSchemaError([], 'Expected a schema object, got undefined'),
    );
  });

  it('should throw when schema is an array', () => {
    expect(() => validateSchema([])).toThrow(new InvalidSchemaError([], 'Expected a schema object, got []Array'));
  });
});
