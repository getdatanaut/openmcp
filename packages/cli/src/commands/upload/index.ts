import type { Arguments, Argv, CommandBuilder, CommandModule } from 'yargs';

import handler from './handler.ts';

type Args = {
  timeout: number;
} & (
  | {
      type: 'sse' | 'streamable-http' | 'openapi';
      source: string;
      headers: string[];
    }
  | {
      type: 'stdio';
      command: string;
    }
);

const builder = ((yargs: Argv) =>
  yargs
    .strict()
    .options({
      type: {
        choices: ['stdio', 'sse', 'streamable-http', 'openapi'],
        demandOption: true,
      },
      timeout: {
        type: 'number',
        describe: 'Timeout in milliseconds for the server/command to respond',
        default: 10_000,
      },
      headers: {
        type: 'array',
        describe: 'Headers to send with the request. Applicable to sse, streamable-http and openapi types.',
        default: [],
        group: 'HTTP Options',
      },
      source: {
        type: 'string',
        describe:
          'Source URL for the tool. Applicable to sse, streamable-http and openapi types. For openapi type this can be both a URL or a file path.',
        group: 'HTTP Options',
      },
      command: {
        type: 'string',
        describe: 'Command to run. Applicable to stdio type.',
      },
    } as const)
    .check((argv): argv is Arguments<Args> => {
      switch (argv.type) {
        case 'stdio':
          if (typeof argv.command !== 'string') {
            throw new Error('Command must be provided for stdio type');
          }
          break;
        case 'sse':
        case 'streamable-http':
        case 'openapi':
          if (typeof argv.source !== 'string') {
            throw new Error('Source URL must be provided for sse, streamable-http and openapi types');
          }
          if (argv.type !== 'openapi' && !URL.canParse(argv.source)) {
            throw new Error('Source URL must be a valid URL');
          }
          break;
        default:
          throw new Error('Type must be provided');
      }

      return true;
    })) satisfies CommandBuilder<Args, Args>;

export default {
  command: 'upload',
  builder,
  describe: 'Upload an mpc server',
  // describe: false, // Hides the command from the help output
  async handler(args) {},
} satisfies CommandModule<{}, Args>;
