import { default as yargs } from 'yargs';
import { hideBin } from 'yargs/helpers';

import console from '#libs/console';

import installCommand from './commands/install/index.ts';
import loginCommand from './commands/login/index.ts';
import logoutCommand from './commands/logout/index.ts';
import runCommand from './commands/run/index.ts';
import uninstallCommand from './commands/uninstall/index.ts';
import uploadCommand from './commands/upload/index.ts';
import whoamiCommand from './commands/whoami/index.ts';
import { HandlerError } from './errors/index.ts';

export default async function register(argv: string[]) {
  try {
    await yargs(hideBin(process.argv))
      .scriptName('openmcp')
      .version()
      .help(true)
      .fail((msg, err, yargs) => {
        if (err instanceof HandlerError) {
          console.error(err.message);
        } else {
          console.restoreAll();
          if (msg !== null) {
            process.stderr.write(String(msg) + '\n');
          }
          yargs.showHelp();
          process.exit(1);
        }
      })
      .wrap(yargs().terminalWidth())
      .strictCommands()
      .command(loginCommand)
      .command(logoutCommand)
      .command(whoamiCommand)
      .command(installCommand)
      .command(uninstallCommand)
      .command(runCommand)
      .command(uploadCommand)
      .demandCommand(1, '')
      .parse(argv);
  } catch {
    process.exit(1);
  }
}
