import { log } from '@clack/prompts';
import { type ConsolaReporter, type LogObject, type LogType } from 'consola/core';
import color from 'picocolors';

type LogFn = (message: string) => void;

const map = {
  error: log.error,
  fatal: log.error,
  fail: log.error,

  warn: log.warn,

  info: log.info,
  log: (message: string) =>
    log.message(message, {
      symbol: color.cyan('~'),
    }),

  box: log.message,
  start: (message: string) =>
    log.message(message, {
      symbol: color.cyanBright(String.fromCharCode(0x25d0)),
    }),

  success: log.success,
  ready: log.success,

  debug: log.step,
  trace: log.step,
  verbose: log.step,

  silent: () => {
    // no-op
  },
} as const satisfies Record<LogType, LogFn>;

// Format the message from logObj
function formatMessage(logObj: LogObject): string {
  const serializedArgs = [logObj.message, ...logObj.args].filter(v => v !== undefined).map(v => String(v));

  return serializedArgs.join(' ');
}

const fancyReporter: ConsolaReporter = {
  log(logObj) {
    const message = formatMessage(logObj);
    map[logObj.type](message);
  },
};

export default fancyReporter;
