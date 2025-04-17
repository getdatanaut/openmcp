import type { StdioServerParameters } from '@modelcontextprotocol/sdk/client/stdio.js';

import type { TransportConfig } from '../../transport-definitions/types.ts';
import type { Result, ResultArg } from './types.ts';

export default class ParsedCommand {
  readonly #result: Result;

  constructor(result: Result) {
    this.#result = result;
  }

  get externalId() {
    return this.#result.externalId;
  }

  get configSchema() {
    return this.#result.configSchema;
  }

  getStdioServerParameters(cwd: string): StdioServerParameters {
    return {
      command: this.#result.command,
      args: this.#result.args.map(ParsedCommand.#serializeServerArg),
      cwd,
      env: {
        ...(Object.fromEntries(Object.entries(process.env).filter(([, value]) => value !== undefined)) as Record<
          string,
          string
        >),
        ...this.#result.env,
      },
    };
  }

  static #serializeArg(arg: ResultArg, masked: boolean): string {
    if (arg.type === 'command') {
      return arg.value;
    }

    if (arg.type === 'positional') {
      const value = (masked ? arg.masked : null) ?? arg.value;
      return trimQuotes(value);
    }

    const name = arg.name.length === 1 ? `-${arg.name}` : `--${arg.name}`;
    switch (arg.dataType) {
      case 'boolean':
        return arg.value ? name : `-no${name}`;
      case 'number':
        return [name, (masked ? arg.masked : null) ?? arg.value].join('=');
      case 'string':
      default:
        return [name, (masked ? arg.masked : null) ?? arg.value].join('=');
    }
  }

  static #serializeServerArg(arg: ResultArg): string {
    return ParsedCommand.#serializeArg(arg, false);
  }

  getTransportConfig(): TransportConfig<'stdio'> {
    return {
      type: 'stdio',
      command: this.#result.command,
      args: this.#result.args.map(arg => ParsedCommand.#serializeArg(arg, true)),
      env: this.#result.env,
    };
  }
}

function trimQuotes(str: string): string {
  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    return str.slice(1, -1);
  }

  return str;
}
