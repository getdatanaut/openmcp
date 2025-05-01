import type { CommandModule } from 'yargs';

import { whoami } from '#libs/datanaut-auth-cli';

import { createHandler } from '../../cli-utils/index.ts';

export default {
  command: 'whoami',
  describe: process.env['NODE_ENV'] === 'development' ? 'Display Datanaut email' : false,
  handler: createHandler(whoami),
} satisfies CommandModule;
