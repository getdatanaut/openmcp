import { default as yargsParser } from 'yargs-parser';

import parseEnvVariables from './parse-env-variables.ts';
import type { Result, ResultArg } from './types.ts';
import { toInterpolable, toScreamCase } from './utils.ts';

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

function handleArbitraryArg(name: string, value: unknown): ResultArg {
  return {
    type: 'flag',
    name,
    raw: String(value),
    value: String(value),
  };
}

export default function parseDockerRun(command: string, input: string): Omit<Result, 'env'> {
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

  const positional = argv._.slice(runCommandIndex + 1).map(String);

  if (positional.length === 0) {
    throw new Error('No image name found');
  }

  const externalId = positional[0]!;

  const vars = new Set<string>();
  const args: ResultArg[] = [];
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
            name,
            raw: item,
            value: parseEnvVariables(String(item))
              .vars.map(([name, val]) => {
                if (val === 'true' || val === 'false' || val === '0' || val === '1') {
                  return [name, val].join('=');
                }

                const varName = toScreamCase(name);
                vars.add(varName);
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
      raw: item,
      value: item,
    });
  }

  return {
    command,
    args,
    externalId,
    vars,
  };
}
