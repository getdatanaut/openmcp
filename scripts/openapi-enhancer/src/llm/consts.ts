import type { ResponseFormatJSONSchema } from 'openai/resources/shared';

export const JSON_PATCH_SCHEMA = {
  strict: false,
  name: 'RFC6902-JSON-Patch',
  description:
    'A JSON patch object. See https://datatracker.ietf.org/doc/html/rfc6902#section-3.1 for more information.',
  schema: {
    type: 'object',
    properties: {
      patch: {
        type: 'array',
        description:
          'A JSON patch object. See https://datatracker.ietf.org/doc/html/rfc6902#section-3.1 for more information.',
        items: {
          type: 'object',
        },
        required: ['op', 'path'],
        properties: {
          op: {
            type: 'string',
            enum: ['add', 'remove', 'replace', 'test'],
          },
          path: { type: 'string' },
          value: {
            $ref: '#/%24defs/Value',
          },
          from: { type: 'string' },
        },
      },
    },
    required: ['patch'],
    additionalProperties: false,
    $defs: {
      Value: {
        anyOf: [
          {
            type: 'string',
          },
          {
            type: 'number',
          },
          {
            type: 'boolean',
          },
          {
            type: 'null',
          },
          {
            type: 'array',
            items: {
              $ref: '#/%24defs/Value',
            },
          },
          {
            type: 'object',
          },
        ],
      },
    },
  },
} satisfies ResponseFormatJSONSchema.JSONSchema;
