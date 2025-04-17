import type { StdioServerParameters } from '@modelcontextprotocol/sdk/client/stdio.js';
import type { TransportConfig } from '@openmcp/manager';

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
      args: this.#result.args.map(ParsedCommand.serializeArg),
      cwd,
      env: this.#result.env,
    };
  }

  static serializeArg(arg: ResultArg): string {
    if (arg.type === 'positional') {
      return arg.value;
    }

    const isBoolean = arg.raw === 'true' || arg.raw === 'false';
    const name = arg.name.length === 1 ? `-${arg.name}` : `--${arg.name}`;
    return isBoolean ? name : `${name} ${arg.value}`;
  }

  getTransportConfig(): TransportConfig<'stdio'> {
    return {
      type: 'stdio',
      config: {
        command: this.#result.command,
        args: this.#result.args.map(arg => arg.value),
        env: this.#result.env,
      },
    };
  }
}
