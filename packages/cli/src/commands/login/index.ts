import type { CommandModule } from 'yargs';

import { login } from '#libs/datanaut-auth-cli';

import { createHandler } from '../../cli-utils/index.ts';

export default {
  command: 'login',
  describe: process.env['NODE_ENV'] === 'development' ? 'Login to the CLI' : false,
  handler: createHandler(login),
} satisfies CommandModule;
