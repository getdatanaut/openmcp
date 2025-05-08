import type { CommandModule } from 'yargs';

import { createHandler } from '#libs/cli-utils';

import type { BuilderArgv } from '../install/index.ts';
import { builder } from '../install/index.ts';
import handler from './handler.ts';

export default {
  describe: process.env['NODE_ENV'] === 'development' ? 'Uninstall the target' : false,
  command: 'uninstall <target>',
  builder,
  handler: createHandler(async args => {
    const { target, client, type, scope } = args as BuilderArgv & {
      target: string;
    };

    await handler(target, {
      client,
      type,
      scope,
    });
  }, true),
} satisfies CommandModule;
