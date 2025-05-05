import type { CommandModule } from 'yargs';

import { createHandler } from '#libs/cli-utils';
import { logout } from '#libs/datanaut-auth-cli';

export default {
  command: 'logout',
  describe: process.env['NODE_ENV'] === 'development' ? 'Logout from the CLI' : false,
  handler: createHandler(logout),
} satisfies CommandModule;
