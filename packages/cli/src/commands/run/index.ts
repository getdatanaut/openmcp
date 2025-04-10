import type { Argv, CommandBuilder, CommandModule } from 'yargs';

import handler from './handler.ts';

const builder = ((yargs: Argv) =>
  yargs.strict().options({
    server: {
      type: 'string',
      describe: 'The name of the server to start',
      demandOption: true,
    },
    secret: {
      type: 'string',
      describe: 'The secret to use for authentication',
    },
  } as const)) satisfies CommandBuilder;

export default {
  describe: 'Start a new server',
  command: 'run',
  builder,
  async handler(args) {
    const { server, secret } = args as Awaited<ReturnType<typeof builder>['argv']>;
    await handler({
      server,
      secret,
    });
  },
} satisfies CommandModule;
