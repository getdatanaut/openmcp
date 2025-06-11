import { InvalidSchemaError } from '../errors.ts';
import type { Context, SchemaWithType } from '../types.ts';
import { validateKeywordValueType } from './common.ts';

const supportedFormats = new Set([
  'date-time',
  'time',
  'date',
  'duration',
  'email',
  'hostname',
  'ipv4',
  'ipv6',
  'uuid',
]);

export function validateString(ctx: Context, schema: SchemaWithType<'string'>): boolean {
  const errorsCount = ctx.errors.length;

  if (validateKeywordValueType(ctx, schema, 'pattern', 'string', true)) {
    const { pattern } = schema;
    try {
      RegExp(pattern);
    } catch {
      ctx.errors.push(new InvalidSchemaError([...ctx.path, 'pattern'], `Invalid pattern: ${pattern}`));
    }
  }

  if (validateKeywordValueType(ctx, schema, 'format', 'string', true)) {
    const { format } = schema;
    if (!supportedFormats.has(format)) {
      ctx.errors.push(new InvalidSchemaError([...ctx.path, 'format'], `Unsupported format: ${format}`));
    }
  }

  return errorsCount === ctx.errors.length;
}
