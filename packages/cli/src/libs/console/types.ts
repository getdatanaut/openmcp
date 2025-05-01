import type { ConsolaInstance } from 'consola/core';

export type PromptlessConsola = Omit<ConsolaInstance, 'prompt'>;

type Option = {
  label: string;
  hint?: string;
  value: string;
};

export type PromptFn = {
  (message: string, prompt: { type: 'text'; placeholder?: string; default?: string }): Promise<string>;
  (message: string, prompt: { type: 'confirm' }): Promise<boolean>;
  (message: string, prompt: { type: 'select'; initial?: string; options: Option[] }): Promise<string>;
};
