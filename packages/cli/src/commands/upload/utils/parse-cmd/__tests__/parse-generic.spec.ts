import { describe, expect, it } from 'vitest';

import ConfigSchema from '../../config-schema.ts';
import parseGeneric from '../parse-generic.ts';

const cases = [
  [
    'generic simple command',
    {
      command: 'generic',
      externalId: 'generic-simple-command',
      args: [
        { type: 'positional', raw: 'simple', value: 'simple' },
        { type: 'positional', raw: 'command', value: 'command' },
      ],
    },
  ],
  [
    'generic command with "quoted string"',
    {
      command: 'generic',
      externalId: 'generic-command-with',
      args: [
        { type: 'positional', raw: 'command', value: 'command' },
        { type: 'positional', raw: 'with', value: 'with' },
        { type: 'positional', raw: '"quoted string"', value: '"quoted string"' },
      ],
    },
  ],
  [
    "generic command with 'single quoted string'",
    {
      command: 'generic',
      externalId: 'generic-command-with',
      args: [
        { type: 'positional', raw: 'command', value: 'command' },
        { type: 'positional', raw: 'with', value: 'with' },
        { type: 'positional', raw: "'single quoted string'", value: "'single quoted string'" },
      ],
    },
  ],
  [
    'generic command with --flag',
    {
      command: 'generic',
      externalId: 'generic-command-with',
      args: [
        { type: 'positional', raw: 'command', value: 'command' },
        { type: 'positional', raw: 'with', value: 'with' },
        { type: 'positional', raw: '--flag', value: '--flag' },
      ],
    },
  ],
  [
    'generic command with 123',
    {
      command: 'generic',
      externalId: 'generic-command-with',
      args: [
        { type: 'positional', raw: 'command', value: 'command' },
        { type: 'positional', raw: 'with', value: 'with' },
        { type: 'positional', raw: '123', value: '123' },
      ],
    },
  ],
  [
    'generic command with mixed "quoted" and non-quoted args',
    {
      command: 'generic',
      externalId: 'generic-command-with-mixed',
      args: [
        { type: 'positional', raw: 'command', value: 'command' },
        { type: 'positional', raw: 'with', value: 'with' },
        { type: 'positional', raw: 'mixed', value: 'mixed' },
        { type: 'positional', raw: '"quoted"', value: '"quoted"' },
        { type: 'positional', raw: 'and', value: 'and' },
        { type: 'positional', raw: 'non-quoted', value: 'non-quoted' },
        { type: 'positional', raw: 'args', value: 'args' },
      ],
    },
  ],
  [
    'generic 123 starts-with-number',
    {
      command: 'generic',
      externalId: 'generic',
      args: [
        { type: 'positional', raw: '123', value: '123' },
        { type: 'positional', raw: 'starts-with-number', value: 'starts-with-number' },
      ],
    },
  ],
  [
    'generic',
    {
      command: 'generic',
      externalId: 'generic',
      args: [],
    },
  ],
] as const;

describe('parseGeneric', () => {
  it.each(cases)('should parse command: %s', (input, expected) => {
    const [command, ...rest] = input.split(' ') as [string, ...string[]];
    const parsed = parseGeneric(new ConfigSchema(), command, rest.join(' '));
    expect(parsed).toStrictEqual(expected);
  });
});
