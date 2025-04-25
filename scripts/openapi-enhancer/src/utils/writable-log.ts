import type { WriteStream } from 'node:fs';

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

const DEFAULT_INDENTATION = formatDate(new Date()).length + 6; // 6 for 2x [] and 2x space

type LogSeverity = 'error' | 'warn' | 'info' | 'log';

export default class WritableLog implements Disposable {
  readonly #stream: WriteStream;

  constructor(stream: WriteStream) {
    this.#stream = stream;
  }

  write(sev: LogSeverity, value: string) {
    const date = formatDate(new Date());
    this.#stream.write(`[${date}] [${sev.toUpperCase()}] ${value}\n`);
  }

  writeRaw(value: string) {
    this.#stream.write(value);
  }

  static indentString(value: string, indentation: number) {
    const indentationStr = ' '.repeat(indentation);
    return value
      .split('\n')
      .map(line => `${indentationStr}${line}`)
      .join('\n');
  }

  static getDefaultIndentation(sev: LogSeverity) {
    return DEFAULT_INDENTATION + sev.length;
  }

  [Symbol.dispose]() {
    this.#stream.end();
  }
}
