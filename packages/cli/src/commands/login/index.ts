import type { CommandModule } from 'yargs';

import { createHandler } from '../../cli-utils/index.ts';
import { login } from '../../libs/datanaut/auth.ts';

export default {
  command: 'login',
  describe: 'Login to the CLI',
  handler: createHandler(login),
} satisfies CommandModule;
