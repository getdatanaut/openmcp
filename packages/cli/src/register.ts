import { default as yargs } from 'yargs';
import { hideBin } from 'yargs/helpers';

import installCommand from './commands/install/index.ts';
import loginCommand from './commands/login/index.ts';
import logoutCommand from './commands/logout/index.ts';
import runCommand from './commands/run/index.ts';
import uninstallCommand from './commands/uninstall/index.ts';
import uploadCommand from './commands/upload/index.ts';
import consola from './consola/index.ts';
import { HandlerError } from './errors/index.ts';

export default async function register(argv: string[]) {
  consola.wrapAll();
  try {
    await yargs(hideBin(process.argv))
      .scriptName('openmcp')
      .version()
      .help(true)
      .showHelpOnFail(false)
      .fail((_msg, err, yargs) => {
        if (err instanceof HandlerError) {
          consola.error(err.message);
        } else {
          yargs.showHelp();
          process.exit(1);
        }
      })
      .wrap(yargs().terminalWidth())
      .strictCommands()
      .command(loginCommand)
      .command(logoutCommand)
      .command(installCommand)
      .command(uninstallCommand)
      .command(runCommand)
      .command(uploadCommand)
      .demandCommand(1, '')
      .parse(argv);
  } catch {
    consola.restoreAll();
    process.exit(1);
  }
}
