import type { CommandModule } from 'yargs';

import { login } from '#libs/datanaut-auth-cli';

import { createHandler } from '../../cli-utils/index.ts';

export default {
  command: 'login',
  describe: 'Login to the CLI',
  handler: createHandler(login),
} satisfies CommandModule;
