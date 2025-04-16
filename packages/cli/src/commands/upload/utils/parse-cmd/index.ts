import parseDockerRun from './parse-docker-run.ts';
import parseEnvVariables from './parse-env-variables.ts';
import parseGeneric from './parse-generic.ts';
import parseNpx from './parse-npx-command.ts';
import ParsedCommand from './parsed-command.ts';

function parseCommand(input: string): string {
  const index = input.indexOf(' ');
  if (index === -1) {
    throw new Error('No command name found');
  }

  return input.slice(0, index);
}

const parsers = {
  npx: parseNpx,
  docker: parseDockerRun,
  generic: parseGeneric,
} as const;

export default function parseCmd(input: string): ParsedCommand {
  const { vars, lastIndex: offset } = parseEnvVariables(input);
  const actualInput = input.slice(offset).trim();
  const commandName = parseCommand(actualInput);
  const parse = parsers[commandName] ?? parsers.generic;
  return new ParsedCommand({
    ...parse(commandName, actualInput.slice(commandName.length + 1)),
    env: Object.fromEntries(vars),
  });
}
