import type { CommandModule } from 'yargs';

import { createHandler } from '../../cli-utils/index.ts';
import consola from '../../consola/index.ts';
import { whoami } from '../../libs/auth/index.ts';

export default {
  command: 'whoami',
  describe: 'Display Datanaut email',
  handler: createHandler(() => {
    const { email } = whoami();
    consola.success(`You are logged in as ${email}`);
  }),
} satisfies CommandModule;
