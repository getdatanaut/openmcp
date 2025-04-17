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
        { type: 'positional', dataType: 'string', value: 'simple', masked: null },
        { type: 'positional', dataType: 'string', value: 'command', masked: null },
      ],
    },
  ],
  [
    'generic command with "quoted string"',
    {
      command: 'generic',
      externalId: 'generic-command-with',
      args: [
        { type: 'positional', dataType: 'string', value: 'command', masked: null },
        { type: 'positional', dataType: 'string', value: 'with', masked: null },
        { type: 'positional', dataType: 'string', value: '"quoted string"', masked: null },
      ],
    },
  ],
  [
    "generic command with 'single quoted string'",
    {
      command: 'generic',
      externalId: 'generic-command-with',
      args: [
        { type: 'positional', dataType: 'string', value: 'command', masked: null },
        { type: 'positional', dataType: 'string', value: 'with', masked: null },
        { type: 'positional', dataType: 'string', value: "'single quoted string'", masked: null },
      ],
    },
  ],
  [
    'generic command with --flag',
    {
      command: 'generic',
      externalId: 'generic-command-with',
      args: [
        { type: 'positional', dataType: 'string', value: 'command', masked: null },
        { type: 'positional', dataType: 'string', value: 'with', masked: null },
        { type: 'positional', dataType: 'string', value: '--flag', masked: null },
      ],
    },
  ],
  [
    'generic command with 123',
    {
      command: 'generic',
      externalId: 'generic-command-with',
      args: [
        { type: 'positional', dataType: 'string', value: 'command', masked: null },
        { type: 'positional', dataType: 'string', value: 'with', masked: null },
        { type: 'positional', dataType: 'string', value: '123', masked: null },
      ],
    },
  ],
  [
    'generic command with mixed "quoted" and non-quoted args',
    {
      command: 'generic',
      externalId: 'generic-command-with-mixed',
      args: [
        { type: 'positional', dataType: 'string', value: 'command', masked: null },
        { type: 'positional', dataType: 'string', value: 'with', masked: null },
        { type: 'positional', dataType: 'string', value: 'mixed', masked: null },
        { type: 'positional', dataType: 'string', value: '"quoted"', masked: null },
        { type: 'positional', dataType: 'string', value: 'and', masked: null },
        { type: 'positional', dataType: 'string', value: 'non-quoted', masked: null },
        { type: 'positional', dataType: 'string', value: 'args', masked: null },
      ],
    },
  ],
  [
    'generic 123 starts-with-number',
    {
      command: 'generic',
      externalId: 'generic',
      args: [
        { type: 'positional', dataType: 'string', value: '123', masked: null },
        { type: 'positional', dataType: 'string', value: 'starts-with-number', masked: null },
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
