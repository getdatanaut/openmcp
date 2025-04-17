import type ConfigSchema from '../config-schema.ts';
import type { Result } from './types.ts';

function splitByWhitespacePreservingQuotes(input: string): string[] {
  // Regular expression to match:
  // 1. Double-quoted strings: "[^"]*"
  // 2. Single-quoted strings: '[^']*'
  // 3. Sequences of non-whitespace characters: \S+
  const regex = /"[^"]*"|'[^']*'|\S+/g;
  const matches = input.match(regex);

  // Return the array of matches, or an empty array if no matches are found
  return matches || [];
}

function isChar(code: number): boolean {
  return (code >= 0x41 && code <= 0x5a) || (code >= 0x61 && code <= 0x7a);
}

export default function parseGeneric(
  _configSchema: ConfigSchema,
  command: string,
  input: string,
): Omit<Result, 'env' | 'configSchema'> {
  const args = splitByWhitespacePreservingQuotes(input);
  const externalId = [command];
  for (const arg of args) {
    if (isChar(arg.charCodeAt(0))) {
      externalId.push(arg);
    } else {
      break;
    }
  }

  return {
    command,
    args: args.map(arg => ({
      type: 'positional',
      dataType: 'string',
      value: arg,
      masked: null,
    })),
    externalId: externalId.join('-'),
  };
}
