import type { CommandModule } from 'yargs';

import { logout } from '#libs/datanaut-auth-cli';

import { createHandler } from '../../cli-utils/index.ts';

export default {
  command: 'logout',
  describe: process.env['NODE_ENV'] === 'development' ? 'Logout from the CLI' : false,
  handler: createHandler(logout),
} satisfies CommandModule;
