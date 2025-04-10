import { default as yargs } from 'yargs';

import packageJson from '../package.json' with { type: 'json' };
import runCommand from './commands/run/index.ts';

export default async function register(argv: string[]) {
  await yargs()
    .scriptName(packageJson.name)
    .version()
    .help(true)
    .showHelpOnFail(true)
    .wrap(yargs().terminalWidth())
    .strictCommands()
    .strictOptions()
    .command(runCommand)
    .demandCommand(1, '')
    .parse(argv);
}
