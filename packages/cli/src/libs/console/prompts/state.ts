import { action, observable } from 'mobx';

import { OperationTimedOutError } from '#errors';

import type { ConfirmPrompt, MultiSelectPrompt, SelectPrompt, TextPrompt } from './types.ts';

const DEFAULT_TIMEOUT = 5 * 60_000; // 5 minutes

type TextPromptResult = {
  type: 'text';
  config: TextPrompt['config'];
  resolve(value: string | PromiseLike<string>): void;
  reject(reason: unknown): void;
};

type ConfirmPromptResult = {
  type: 'confirm';
  config: ConfirmPrompt['config'];
  resolve(value: boolean | PromiseLike<boolean>): void;
  reject(reason: unknown): void;
};

type SelectPromptResult = {
  type: 'select';
  config: SelectPrompt['config'];
  resolve(value: string | PromiseLike<string>): void;
  reject(reason: unknown): void;
};

type MultiSelectPromptResult = {
  type: 'multi-select';
  config: MultiSelectPrompt['config'];
  resolve(value: string[] | PromiseLike<string[]>): void;
  reject(reason: unknown): void;
};

type PromptResult = TextPromptResult | ConfirmPromptResult | SelectPromptResult | MultiSelectPromptResult;

export const currentPrompt = observable.box<PromptResult | null>(null, {
  deep: false,
});

function _setPrompt(prompt: ConfirmPrompt, timeout?: number): Promise<boolean>;
function _setPrompt(prompt: TextPrompt, timeout?: number): Promise<string>;
function _setPrompt(prompt: SelectPrompt, timeout?: number): Promise<string>;
function _setPrompt(prompt: MultiSelectPrompt, timeout?: number): Promise<string[]>;
async function _setPrompt(
  prompt: ConfirmPrompt | TextPrompt | SelectPrompt | MultiSelectPrompt,
  timeout = DEFAULT_TIMEOUT,
): Promise<string | boolean | string[]> {
  const { promise, resolve, reject } = Promise.withResolvers<string | boolean | string[]>();
  currentPrompt.set({
    type: prompt.type,
    config: prompt.config,
    resolve,
    reject,
  } as PromptResult);

  const id = setTimeout(() => {
    reject(new OperationTimedOutError(timeout));
  }, timeout);
  return promise.finally(
    action(() => {
      currentPrompt.set(null);
      clearTimeout(id);
    }),
  );
}

export const setAndWaitForPrompt = action(_setPrompt);
