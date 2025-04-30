import type { CommandModule } from 'yargs';

import { whoami } from '#libs/datanaut-auth-cli';

import { createHandler } from '../../cli-utils/index.ts';

export default {
  command: 'whoami',
  describe: 'Display Datanaut email',
  handler: createHandler(whoami),
} satisfies CommandModule;
