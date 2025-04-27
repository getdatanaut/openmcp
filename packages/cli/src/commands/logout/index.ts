import type { CommandModule } from 'yargs';

import { createHandler } from '../../cli-utils/index.ts';
import consola from '../../consola/index.ts';
import { logout } from '../../libs/auth/index.ts';

export default {
  command: 'logout',
  describe: 'Logout from the CLI',
  handler: createHandler(async () => {
    consola.start('Logging out...');
    await logout();
    consola.success('Logged out successfully');
  }),
} satisfies CommandModule;
