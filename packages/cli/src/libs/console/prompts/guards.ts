import { isPlainObject } from '@stoplight/json';

import type { MultiSelectPrompt, Prompt, SelectPrompt, TextPrompt } from './types.ts';

export function isTextPrompt(prompt: unknown): prompt is TextPrompt {
  return isPlainObject(prompt) && prompt['type'] === 'text';
}

export function isConfirmPrompt(prompt: unknown): prompt is Prompt {
  return isPlainObject(prompt) && prompt['type'] === 'confirm';
}

export function isSelectPrompt(prompt: unknown): prompt is SelectPrompt {
  return isPlainObject(prompt) && prompt['type'] === 'select';
}

export function isMultiSelectPrompt(prompt: unknown): prompt is MultiSelectPrompt {
  return isPlainObject(prompt) && prompt['type'] === 'multi-select';
}
