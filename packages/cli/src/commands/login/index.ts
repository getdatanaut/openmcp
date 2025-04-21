import type { CommandModule } from 'yargs';

import { login } from '../../libs/auth/index.ts';

export default {
  command: 'login',
  async handler() {
    console.log('Logging in...');
    const { email } = await login();
    console.log(`Logged in successfully as ${email}`);
  },
} satisfies CommandModule;
