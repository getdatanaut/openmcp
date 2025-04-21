import { type ConsolaReporter } from 'consola/core';

const LOG_LEVELS = {
  0: 'error',
  1: 'warn',
  2: 'log',
  3: 'info',
  4: 'debug',
  5: 'trace',
} as const;

export default {
  log(logObject) {
    const args = logObject.message === undefined ? logObject.args : [logObject.message, ...logObject.args];
    // eslint-disable-next-line no-console
    console[LOG_LEVELS[logObject.level]](...args);
  },
} as const satisfies ConsolaReporter;
