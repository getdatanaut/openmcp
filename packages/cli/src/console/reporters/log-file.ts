import { type ConsolaReporter, LogLevels, type LogObject } from 'consola/core';

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  const timezoneOffset = -date.getTimezoneOffset();
  const timezoneHours = String(Math.floor(Math.abs(timezoneOffset) / 60)).padStart(2, '0');
  const timezoneMinutes = String(Math.abs(timezoneOffset) % 60).padStart(2, '0');
  const timezoneSign = timezoneOffset >= 0 ? '+' : '-';

  const timezone = `${timezoneSign}${timezoneHours}:${timezoneMinutes}`;

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} ${timezone}`;
}

function formatMessage(logObj: LogObject) {
  const date = formatDate(logObj.date);
  const serializedArgs = [logObj.message, ...logObj.args].filter(v => v !== undefined).map(v => String(v));
  return `[${date}] [${logObj.type.toUpperCase()}] ${serializedArgs.join(' ')}\n`;
}

export default {
  log(logObj, { options }) {
    if (logObj.level <= LogLevels.error) {
      options.stderr?.write(formatMessage(logObj));
    } else {
      options.stdout?.write(formatMessage(logObj));
    }
  },
} as const satisfies ConsolaReporter;
