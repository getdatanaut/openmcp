import type { Argv, CommandBuilder, CommandModule } from 'yargs';

import { wrapConsole } from '../../console/index.ts';

const builder = ((yargs: Argv) =>
  yargs
    .strict()
    .options({
      server: {
        type: 'string',
        describe: 'The name of the server to start',
      },
      config: {
        type: 'string',
        describe: 'The filepath to the local config file',
      },
      secret: {
        type: 'string',
        describe: 'The secret to use for authentication',
      },
    } as const)
    .check(argv => {
      if (!argv.config && !(argv.server && argv.secret)) {
        throw new Error('You must provide either "config" or both "server" and "secret".');
      }

      return true;
    })) satisfies CommandBuilder;

export default {
  describe: 'Start a new server',
  command: 'upload',
  builder,
  async handler(args) {
    const restoreConsole = await wrapConsole();
    const { default: handler } = await import('./handler.ts');

    const { server, secret, config } = args as Awaited<ReturnType<typeof builder>['argv']>;
    try {
      if (typeof config === 'string') {
        await handler({
          configFile: config,
        });
      } else {
        await handler({
          server: String(server),
          secret,
        });
      }
    } finally {
      restoreConsole();
    }
  },
} satisfies CommandModule;
