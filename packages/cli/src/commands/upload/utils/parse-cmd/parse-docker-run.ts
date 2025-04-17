import { default as yargsParser } from 'yargs-parser';

import type ConfigSchema from '../config-schema.ts';
import { toInterpolable, toScreamCase } from '../string.ts';
import parseEnvVariables from './parse-env-variables.ts';
import type { Result, ResultArg, ResultArgFlag } from './types.ts';

const KNOWN_BOOLEAN_FLAGS = [
  'd',
  'detach', // -d
  'disable-content-trust',
  'init',
  'i',
  'interactive', // -i
  'no-healthcheck',
  'oom-kill-disable',
  'privileged',
  'P',
  'publish-all', // -P
  'q',
  'quiet', // -q
  'read-only',
  'rm',
  'sig-proxy',
  't',
  'tty', // -t
];

const KNOWN_ARRAY_FLAGS = [
  'add-host',
  'annotation',
  'a',
  'attach', // -a
  'blkio-weight-device',
  'cap-add',
  'cap-drop',
  'device',
  'device-cgroup-rule',
  'device-read-bps',
  'device-read-iops',
  'device-write-bps',
  'device-write-iops',
  'dns',
  'dns-option',
  'dns-search',
  'e',
  'env', // -e
  'env-file',
  'expose',
  'group-add',
  'l',
  'label', // -l
  'label-file',
  'link',
  'link-local-ip',
  'log-opt',
  'mount',
  'network-alias',
  'p',
  'port', // -p
  'security-opt',
  'storage-opt',
  'tmpfs',
  'ulimit',
  'v',
  'volume', // -v
  'volumes-from',
];

function handleArbitraryArg(name: string, value: unknown): ResultArgFlag {
  // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
  switch (typeof value) {
    case 'boolean':
      return {
        type: 'flag',
        dataType: 'boolean',
        name,
        value,
      };
    case 'number':
      return {
        type: 'flag',
        dataType: 'number',
        name,
        value: String(value),
        masked: null,
      };
    default:
      return {
        type: 'flag',
        dataType: 'string',
        name,
        value: String(value),
        masked: null,
      };
  }
}

export default function parseDockerRun(
  configSchema: ConfigSchema,
  command: string,
  input: string,
): Omit<Result, 'env' | 'configSchema'> {
  const argv = yargsParser(input, {
    configuration: {
      'dot-notation': false,
      'camel-case-expansion': false,
      'short-option-groups': true,
      'greedy-arrays': false,
    },
    boolean: KNOWN_BOOLEAN_FLAGS,
    array: KNOWN_ARRAY_FLAGS,
  });

  const runCommandIndex = argv._.indexOf('run');
  if (runCommandIndex === -1) {
    throw new Error('No run command found');
  }

  const positional = argv._.slice(runCommandIndex + 1);

  if (positional.length === 0) {
    throw new Error('No image name found');
  }

  const externalId = String(positional[0]!);

  const args: ResultArg[] = argv._.slice(0, runCommandIndex + 1).map(arg => {
    return {
      type: 'command',
      value: String(arg),
    };
  });

  for (const [name, value] of Object.entries(argv)) {
    switch (name) {
      case '_':
        // positional arguments, will be handled later
        break;
      case 'e':
      case 'env':
        for (const item of value) {
          args.push({
            type: 'flag',
            dataType: 'string',
            name,
            value: String(item),
            masked: parseEnvVariables(String(item))
              .vars.map(([name, value]) => {
                const type = configSchema.inferType(value);
                if (type === 'boolean') {
                  return [name, value].join('=');
                }

                const varName = configSchema.add(toScreamCase(name), type);
                return [name, toInterpolable(varName)].join('=');
              })
              .join(' '),
          });
        }
        break;
      default:
        if (Array.isArray(value)) {
          for (const item of value) {
            args.push(handleArbitraryArg(name, item));
          }
        } else {
          args.push(handleArbitraryArg(name, value));
        }
    }
  }

  for (const item of positional) {
    args.push({
      type: 'positional',
      dataType: 'string',
      value: String(item),
      masked: null,
    });
  }

  return {
    command,
    args,
    externalId,
  };
}
