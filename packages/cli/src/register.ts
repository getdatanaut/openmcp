import { default as yargs } from 'yargs';
import { hideBin } from 'yargs/helpers';

import packageJson from '../package.json' with { type: 'json' };
import runCommand from './commands/run/index.ts';
import uploadCommand from './commands/upload/index.ts';

export default async function register(argv: string[]) {
  await yargs(hideBin(process.argv))
    .scriptName(packageJson.name)
    .version()
    .help(true)
    .showHelpOnFail(true)
    .wrap(yargs().terminalWidth())
    .strictCommands()
    .command(runCommand)
    .command(uploadCommand)
    .demandCommand(1, '')
    .parse(argv);
}
