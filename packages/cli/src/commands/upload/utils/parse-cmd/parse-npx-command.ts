import yargsParser from 'yargs-parser';

import type { Result, ResultArg } from './types.ts';
import { toInterpolable, toScreamCase } from './utils.ts';

const KNOWN_BOOLEAN_FLAGS = ['y', 'yes', 'q', 'quiet'];

export default function parseNpx(command: string, input: string): Omit<Result, 'env'> {
  const argv = yargsParser(input, {
    configuration: {
      'camel-case-expansion': false,
      'unknown-options-as-args': true,
    },
    boolean: KNOWN_BOOLEAN_FLAGS,
  });
  const positional = argv._.slice(1).map(String);
  if (positional.length === 0) {
    throw new Error('No package found');
  }

  const externalId: string = positional[0]!;
  const flags: ResultArg[] = [];
  for (const [name, value] of Object.entries(argv)) {
    if (name === '_') {
      // positional arguments - will be handled later
      continue;
    }

    if (typeof value === 'boolean') {
      flags.push({
        type: 'flag',
        name,
        raw: String(value),
        value: String(value),
      });
    }
  }

  const vars = new Set<string>();
  const positionalArgs = positional.slice(1).map<ResultArg>(arg => {
    if (arg.startsWith('-')) {
      return {
        type: 'positional',
        raw: arg,
        value: arg,
      };
    }

    const varName = toScreamCase(`ARG_${vars.size}`);
    vars.add(varName);
    return {
      type: 'positional',
      raw: arg,
      value: toInterpolable(varName),
    };
  });

  return {
    command,
    args: [
      ...flags,
      {
        type: 'positional',
        raw: externalId,
        value: externalId,
      },
      ...positionalArgs,
    ],
    externalId,
    vars,
  };
}
