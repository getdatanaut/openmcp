// Based on https://github.com/bombshell-dev/clack/blob/37198d51e468bbf55e8b2c50327c3ba9a220390a/packages/prompts/src/index.ts#L151
// Can be removed once this PR https://github.com/bombshell-dev/clack/pull/241 lands on main and is released
/**
 * MIT License
 *
 * Copyright (c) Nate Moore
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
import { PasswordPrompt, type State } from '@clack/core';
import isUnicodeSupported from 'is-unicode-supported';
import color from 'picocolors';

import { assertFulfilled } from './guards.ts';

const unicode = isUnicodeSupported();
const s = (c: string, fallback: string) => (unicode ? c : fallback);

const S_STEP_ACTIVE = s('◆', '*');
const S_STEP_CANCEL = s('■', 'x');
const S_STEP_ERROR = s('▲', 'x');
const S_STEP_SUBMIT = s('◇', 'o');

const S_BAR = s('│', '|');
const S_BAR_DETAIL = s('│ ', `|${color.italic('i')}`);
const S_BAR_END = s('└', '—');

const S_PASSWORD_MASK = s('▪', '•');

const symbol = (state: State) => {
  switch (state) {
    case 'initial':
    case 'active':
      return color.cyan(S_STEP_ACTIVE);
    case 'cancel':
      return color.red(S_STEP_CANCEL);
    case 'error':
      return color.yellow(S_STEP_ERROR);
    case 'submit':
      return color.green(S_STEP_SUBMIT);
  }
};

const help = (text: string | undefined, style: (input: string) => string) => {
  if (text === undefined) return '';
  return `${style(S_BAR_DETAIL)} ${color.dim(color.italic(text))}\n`;
};

export interface PasswordOptions {
  message: string;
  help?: string;
  mask?: string;
  validate?: (value: string) => string | Error | undefined;
}

export const password = async (opts: PasswordOptions): Promise<string> => {
  const res = await new PasswordPrompt({
    validate: opts.validate,
    mask: opts.mask ?? S_PASSWORD_MASK,
    render() {
      const title = `${color.gray(S_BAR)}\n${symbol(this.state)}  ${opts.message}\n`;
      const value = this.valueWithCursor;
      const masked = this.masked;

      // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
      switch (this.state) {
        case 'error':
          return `${title.trim()}\n${help(opts.help, color.yellow)}${color.yellow(S_BAR)}  ${masked}\n${color.yellow(
            S_BAR_END,
          )}  ${color.yellow(this.error)}\n`;
        case 'submit':
          return `${title}${color.gray(S_BAR)}  ${color.dim(masked)}`;
        case 'cancel':
          return `${title}${color.gray(S_BAR)}  ${color.strikethrough(color.dim(masked ?? ''))}${
            masked ? `\n${color.gray(S_BAR)}` : ''
          }`;
        default:
          return `${title}${help(opts.help, color.cyan)}${color.cyan(S_BAR)}  ${value}\n${color.cyan(S_BAR_END)}\n`;
      }
    },
  }).prompt();
  assertFulfilled(res);
  return res;
};
