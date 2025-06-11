import type { JsonPath } from '@stoplight/types';

export type Context = {
  readonly errors: unknown[];
  readonly path: JsonPath;
  readonly rootSchema: Record<string, unknown>;
  readonly validatedRefs: Set<string>;
  depth: number;
  size: {
    stringLength: number;
    propertiesCount: number;
    enum: {
      totalValues: number;
      totalStringLength: number;
    };
  };
  readonly limits: {
    readonly maxDepth: number;
    readonly totalProperties: number;
    readonly stringLength: number;
    readonly enum: {
      readonly total: number;
      readonly single: number;
      readonly stringLength: number;
    };
  };
};

export type SchemaWithType<T> = {
  type: T;
  [key: string]: unknown;
};

export type ValueType<V extends 'object' | 'array' | 'number' | 'string' | 'boolean' | 'null'> = V extends 'object'
  ? Record<string, unknown>
  : V extends 'array'
    ? unknown[]
    : V extends 'number'
      ? number
      : V extends 'string'
        ? string
        : V extends 'boolean'
          ? boolean
          : V extends 'null'
            ? null
            : never;
