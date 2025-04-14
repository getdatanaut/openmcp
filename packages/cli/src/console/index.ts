import { type ConsolaOptions, type ConsolaReporter, createConsola, LogLevels, type LogType } from 'consola/core';

import console from './reporters/console.ts';

const consola = createConsola({
  reporters: [console],
});

export default {
  error: consola.error,
  warn: consola.warn,
  log: consola.log,
  info: consola.info,
  debug: consola.debug,
  trace: consola.trace,

  consola: {
    get level() {
      return LogLevels[consola.options.level];
    },
    set level(level: LogType) {
      consola.options.level = LogLevels[level];
    },

    get reporters() {
      return consola.options.reporters;
    },
    set reporters(reporters: ConsolaReporter[]) {
      consola.options.reporters = reporters;
    },

    get stderr() {
      return consola.options.stderr;
    },
    set stderr(stderr: ConsolaOptions['stderr']) {
      consola.options.stderr = stderr;
    },
    get stdout() {
      return consola.options.stdout;
    },
    set stdout(stdout: ConsolaOptions['stdout']) {
      consola.options.stdout = stdout;
    },

    wrapConsole: consola.wrapConsole.bind(consola),
    restoreConsole: consola.restoreConsole.bind(consola),
  },
};
