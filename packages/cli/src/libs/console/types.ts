import type { ConsolaInstance } from 'consola/core';

export type PromptlessConsola = Omit<ConsolaInstance, 'prompt'>;
