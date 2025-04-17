import { describe, expect, it } from 'vitest';

import ConfigSchema from '../../config-schema.ts';
import parseNpx from '../parse-npx-command.ts';

const cases = [
  [
    '-y @modelcontextprotocol/server-google-maps',
    {
      command: 'npx',
      externalId: '@modelcontextprotocol/server-google-maps',
      args: [
        { type: 'flag', name: 'y', dataType: 'boolean', value: true },
        {
          type: 'positional',
          dataType: 'string',
          value: '@modelcontextprotocol/server-google-maps',
          masked: null,
        },
      ],
      configSchema: undefined,
    },
  ],
  [
    '-y @modelcontextprotocol/server-filesystem /path/to/allowed/files',
    {
      command: 'npx',
      externalId: '@modelcontextprotocol/server-filesystem',
      args: [
        { type: 'flag', name: 'y', dataType: 'boolean', value: true },
        {
          type: 'positional',
          dataType: 'string',
          value: '@modelcontextprotocol/server-filesystem',
          masked: null,
        },
        { type: 'positional', dataType: 'string', value: '/path/to/allowed/files', masked: '{{ARG_0}}' },
      ],
      configSchema: {
        type: 'object',
        properties: {
          ARG_0: {
            type: 'string',
          },
        },
        required: ['ARG_0'],
      },
    },
  ],
  [
    'shopify-mcp --accessToken ABC --domain my-shop.myshopify.com',
    {
      command: 'npx',
      externalId: 'shopify-mcp',
      args: [
        {
          type: 'positional',
          dataType: 'string',
          value: 'shopify-mcp',
          masked: null,
        },
        {
          type: 'positional',
          dataType: 'string',
          value: '--accessToken',
          masked: null,
        },
        {
          type: 'positional',
          dataType: 'string',
          value: 'ABC',
          masked: '{{ARG_0}}',
        },
        {
          type: 'positional',
          dataType: 'string',
          value: '--domain',
          masked: null,
        },
        {
          type: 'positional',
          dataType: 'string',
          value: 'my-shop.myshopify.com',
          masked: '{{ARG_1}}',
        },
      ],
      configSchema: {
        type: 'object',
        properties: {
          ARG_0: {
            type: 'string',
          },
          ARG_1: {
            type: 'string',
          },
        },
        required: ['ARG_0', 'ARG_1'],
      },
    },
  ],
] as const;

describe('parseNpx', () => {
  it.each(cases)('should parse command: %s', (input, expected) => {
    const configSchema = new ConfigSchema();
    const parsed = parseNpx(configSchema, 'npx', input);
    expect(parsed).toStrictEqual({
      command: expected.command,
      args: expected.args,
      externalId: expected.externalId,
    });
    expect(configSchema.serialize()).toStrictEqual(expected.configSchema);
  });
});
