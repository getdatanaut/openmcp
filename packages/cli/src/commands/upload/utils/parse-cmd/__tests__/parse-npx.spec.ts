import { describe, expect, it } from 'vitest';

import parseNpx from '../parse-npx-command.ts';

const cases = [
  [
    'npx -y @modelcontextprotocol/server-google-maps',
    {
      command: 'npx',
      externalId: '@modelcontextprotocol/server-filesystem',
      args: [{ type: 'flag', name: 'y', raw: 'true', value: 'true' }],
      vars: new Set(),
    },
  ],
  [
    'npx -y @modelcontextprotocol/server-filesystem /path/to/allowed/files',
    {
      command: 'npx',
      externalId: '@modelcontextprotocol/server-filesystem',
      args: [
        { type: 'flag', name: 'y', raw: 'true', value: 'true' },
        { type: 'positional', raw: '/path/to/allowed/files', value: '{{ARG_0}}' },
      ],
      vars: new Set(['ARG_0']),
    },
  ],
  [
    'npx shopify-mcp --accessToken ABC --domain my-shop.myshopify.com',
    {
      command: 'npx',
      externalId: 'shopify-mcp',
      args: [
        {
          type: 'positional',
          raw: '--accessToken',
          value: '--accessToken',
        },
        {
          raw: 'ABC',
          type: 'positional',
          value: '{{ARG_0}}',
        },
        {
          type: 'positional',
          raw: '--domain',
          value: '--domain',
        },
        {
          raw: 'my-shop.myshopify.com',
          type: 'positional',
          value: '{{ARG_1}}',
        },
      ],
      vars: new Set(['ARG_0', 'ARG_1']),
    },
  ],
] as const;

describe('parseNpx', () => {
  it.each(cases)('should parse command: %s', (input, expected) => {
    const parsed = parseNpx(input);
    expect(parsed).toStrictEqual(expected);
  });
});
