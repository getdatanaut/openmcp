import type { Argv, CommandModule } from 'yargs';

import { createSilentConsole } from '../../consola/index.ts';

const builder = (yargs: Argv) =>
  yargs.strict().options({
    server: {
      type: 'string',
      describe: 'The name of the server to start',
      conflicts: 'config',
    },
    secret: {
      type: 'string',
      describe: 'The secret to use for authentication',
      implies: 'server',
    },
    config: {
      type: 'string',
      describe: 'The filepath to the local config file',
      conflicts: 'server',
    },
  } as const);

export default {
  describe: 'Start a new server',
  command: 'run',
  builder,
  async handler(args) {
    const console = await createSilentConsole();
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
      console.restoreConsole();
    }
  },
} satisfies CommandModule;
