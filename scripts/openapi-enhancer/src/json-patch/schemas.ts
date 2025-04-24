import { z } from 'zod';

export const JsonPatchOperationSchema = z
  .discriminatedUnion('op', [
    z.object({
      op: z.literal('add').describe('Adds a value to an object or inserts it into an array.'),
      path: z.string().describe('A JSON Pointer path referencing the location to add the value.'),
      value: z.unknown().describe('The value to add.'), // value is required for 'add'
    }),
    z.object({
      op: z.literal('remove').describe('Removes a value from an object or array.'),
      path: z.string().describe('A JSON Pointer path referencing the value to remove.'),
    }),
    z.object({
      op: z.literal('replace').describe('Replaces a value.'),
      path: z.string().describe('A JSON Pointer path referencing the value to replace.'),
      value: z.unknown().describe('The new value.'), // value is required for 'replace'
    }),
    z.object({
      op: z.literal('test').describe('Tests that a value at the specified location is equal to the provided value.'),
      path: z.string().describe('A JSON Pointer path referencing the value to test.'),
      value: z.unknown().describe('The value to compare against.'), // value is required for 'test'
    }),
  ])
  .describe('A single JSON Patch operation compliant with RFC 6902.');
