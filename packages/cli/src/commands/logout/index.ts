import type { CommandModule } from 'yargs';

import consola from '../../consola/index.ts';
import { logout } from '../../libs/auth/index.ts';

export default {
  command: 'logout',
  async handler() {
    consola.start('Logging out...');
    await logout();
    consola.success('Logged out successfully');
  },
} satisfies CommandModule;
