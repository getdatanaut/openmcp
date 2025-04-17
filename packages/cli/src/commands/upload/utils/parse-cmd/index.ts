import ConfigSchema from '../config-schema.ts';
import parseDockerRun from './parse-docker-run.ts';
import parseEnvVariables from './parse-env-variables.ts';
import parseGeneric from './parse-generic.ts';
import parseNpx from './parse-npx-command.ts';
import ParsedCommand from './parsed-command.ts';

function parseCommand(input: string): string {
  if (input.length === 0) {
    throw new Error('No command name found');
  }

  const index = input.indexOf(' ');
  return index === -1 ? input : input.slice(0, index);
}

const parsers = {
  npx: parseNpx,
  docker: parseDockerRun,
  generic: parseGeneric,
} as const;

export default function parseCmd(input: string): ParsedCommand {
  const configSchema = new ConfigSchema();
  const { vars, lastIndex: offset } = parseEnvVariables(input);
  const env: Record<string, string> = {};
  for (const [key, value] of vars) {
    configSchema.add(key, configSchema.inferType(value));
    env[key] = value;
  }

  const actualInput = input.slice(offset).trim();
  const commandName = parseCommand(actualInput);
  const parse = parsers[commandName] ?? parsers.generic;
  return new ParsedCommand({
    ...parse(configSchema, commandName, actualInput.slice(commandName.length + 1)),
    configSchema,
    env,
  });
}
