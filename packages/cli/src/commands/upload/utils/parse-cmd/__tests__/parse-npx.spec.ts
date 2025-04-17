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
        { type: 'flag', name: 'y', raw: 'true', value: 'true' },
        {
          type: 'positional',
          raw: '@modelcontextprotocol/server-google-maps',
          value: '@modelcontextprotocol/server-google-maps',
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
        { type: 'flag', name: 'y', raw: 'true', value: 'true' },
        {
          type: 'positional',
          raw: '@modelcontextprotocol/server-filesystem',
          value: '@modelcontextprotocol/server-filesystem',
        },
        { type: 'positional', raw: '/path/to/allowed/files', value: '{{ARG_0}}' },
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
          raw: 'shopify-mcp',
          value: 'shopify-mcp',
        },
        {
          type: 'positional',
          raw: '--accessToken',
          value: '--accessToken',
        },
        {
          type: 'positional',
          raw: 'ABC',
          value: '{{ARG_0}}',
        },
        {
          type: 'positional',
          raw: '--domain',
          value: '--domain',
        },
        {
          type: 'positional',
          raw: 'my-shop.myshopify.com',
          value: '{{ARG_1}}',
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
