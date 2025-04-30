import type { CommandModule } from 'yargs';

import { logout } from '#libs/datanaut-auth-cli';

import { createHandler } from '../../cli-utils/index.ts';

export default {
  command: 'logout',
  describe: 'Logout from the CLI',
  handler: createHandler(logout),
} satisfies CommandModule;
