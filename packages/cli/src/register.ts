import { default as yargs } from 'yargs';
import { hideBin } from 'yargs/helpers';

import loginCommand from './commands/login/index.ts';
import logoutCommand from './commands/logout/index.ts';
import runCommand from './commands/run/index.ts';
import uploadCommand from './commands/upload/index.ts';
import consola from './consola/index.ts';

export default async function register(argv: string[]) {
  consola.wrapAll();
  try {
    await yargs(hideBin(process.argv))
      .scriptName('openmcp')
      .version()
      .help(true)
      .showHelpOnFail(false)
      .wrap(yargs().terminalWidth())
      .strictCommands()
      .command(loginCommand)
      .command(logoutCommand)
      .command(runCommand)
      .command(uploadCommand)
      .demandCommand(1, '')
      .parse(argv);
  } catch {
    consola.restoreAll();
    process.exit(1);
  }
}
