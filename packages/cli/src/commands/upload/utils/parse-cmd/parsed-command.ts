import type { StdioServerParameters } from '@modelcontextprotocol/sdk/client/stdio.js';
import type { TransportConfig } from '@openmcp/manager';

import type { Result } from './types.ts';

export default class ParsedCommand {
  readonly #result: Result;

  constructor(result: Result) {
    this.#result = result;
  }

  get externalId() {
    return this.#result.externalId;
  }

  get vars() {
    return this.#result.vars;
  }

  getStdioServerParameters(cwd: string): StdioServerParameters {
    return {
      command: this.#result.command,
      args: this.#result.args.map(arg => arg.raw),
      cwd,
      env: this.#result.env,
    };
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
