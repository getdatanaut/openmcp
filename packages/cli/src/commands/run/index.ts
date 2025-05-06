import { type Argv } from 'yargs';

import { createHandler } from '#libs/cli-utils';

const builder = (yargs: Argv) =>
  yargs.strict().options({
    server: {
      type: 'string',
      describe: 'The name or id of the server to start',
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
  handler: createHandler(async args => {
    const { default: handler } = await import('./handler.ts');
    const { server, secret, config } = args as Awaited<ReturnType<typeof builder>['argv']>;
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
  }, false),
};
