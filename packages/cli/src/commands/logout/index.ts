import type { CommandModule } from 'yargs';

import { logout } from '../../libs/auth/index.ts';

export default {
  command: 'logout',
  async handler() {
    console.log('Logging out...');
    await logout();
    console.log('Logged out successfully');
  },
} satisfies CommandModule;
