import type { CommandModule } from 'yargs';

import { createHandler } from '#libs/cli-utils';
import { whoami } from '#libs/datanaut-auth-cli';

export default {
  command: 'whoami',
  describe: process.env['NODE_ENV'] === 'development' ? 'Display Datanaut email' : false,
  handler: createHandler(whoami, true),
} satisfies CommandModule;
