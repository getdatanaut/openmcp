import { z } from 'zod';

export const fallback = <TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  fallback: TSchema['_input'],
): z.ZodPipeline<z.ZodType<TSchema['_input'], z.ZodTypeDef, TSchema['_input']>, z.ZodCatch<TSchema>> => {
  return z.custom<TSchema['_input']>().pipe(schema.catch(fallback));
};
