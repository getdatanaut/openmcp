import yargsParser from 'yargs-parser';

import { interpolable, screamCase } from '#libs/string-utils';

import type ConfigSchema from '../config-schema.ts';
import type { Result, ResultArg } from './types.ts';

const KNOWN_BOOLEAN_FLAGS = ['y', 'yes', 'q', 'quiet'];

export default function parseNpx(
  configSchema: ConfigSchema,
  command: string,
  input: string,
): Omit<Result, 'env' | 'configSchema'> {
  const argv = yargsParser(input, {
    configuration: {
      'camel-case-expansion': false,
      'unknown-options-as-args': true,
    },
    boolean: KNOWN_BOOLEAN_FLAGS,
  });
  const positional = argv._;
  if (positional.length === 0) {
    throw new Error('No package found');
  }

  const externalId: string = String(positional[0]!);
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
        dataType: 'boolean',
        value,
      });
    }
  }

  const positionalArgs = positional.slice(1).map<ResultArg>(arg => {
    if (typeof arg === 'number' || arg.startsWith('-')) {
      return {
        type: 'positional',
        dataType: typeof arg as 'string' | 'number',
        value: String(arg),
        masked: null,
      };
    }

    const varName = configSchema.add(screamCase(`ARG_${configSchema.size}`), configSchema.inferType(arg));
    return {
      type: 'positional',
      dataType: 'string',
      value: arg,
      masked: interpolable(varName),
    };
  });

  return {
    command,
    args: [
      ...flags,
      {
        type: 'positional',
        dataType: 'string',
        value: externalId,
        masked: null,
      },
      ...positionalArgs,
    ],
    externalId,
  };
}
