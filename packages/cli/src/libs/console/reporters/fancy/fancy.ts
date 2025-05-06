import type { ConsolaReporter, LogObject, LogType as ConsolaLogType } from 'consola/core';
import { action, observable } from 'mobx';

export type LogType = 'error' | 'warn' | 'info' | 'verbose' | 'start' | 'success';

export type Log = {
  readonly id: string;
  readonly type: LogType;
  readonly message: string;
  readonly timestamp: Date;
};

export const logs = observable.array<Log>([], {
  deep: false,
});

export const addLog = action(function (type: LogType, message: string, timestamp: Date) {
  logs.push({
    id: String(logs.length + 1),
    type,
    message,
    timestamp,
  });
});

const map = {
  error: 'error',
  fatal: 'error',
  fail: 'error',

  warn: 'warn',

  info: 'info',
  log: 'info',

  box: null,
  start: 'start',

  success: 'success',
  ready: 'success',

  debug: 'verbose',
  trace: 'verbose',
  verbose: 'verbose',

  silent: null,
} as const satisfies Record<ConsolaLogType, LogType | null>;

// Format the message from logObj
function formatMessage(logObj: LogObject): string {
  const serializedArgs = [logObj.message, ...logObj.args].filter(v => v !== undefined).map(v => String(v));

  return serializedArgs.join(' ');
}

const fancyReporter: ConsolaReporter = {
  log(logObj) {
    const type = map[logObj.type];
    if (type === null) return;
    const message = formatMessage(logObj);
    addLog(type, message, new Date(logObj.date));
  },
};

export default fancyReporter;
