import type { CommandModule } from 'yargs';

import { createHandler } from '#libs/cli-utils';
import { login } from '#libs/datanaut-auth-cli';

export default {
  command: 'login',
  describe: process.env['NODE_ENV'] === 'development' ? 'Login to the CLI' : false,
  handler: createHandler(login, true),
} satisfies CommandModule;
