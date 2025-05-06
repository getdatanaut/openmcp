import { setAndWaitForPrompt } from './state.ts';
import type { MultiSelectPrompt, SelectPrompt } from './types.ts';

export function select(config: SelectPrompt['config']): Promise<string> {
  return setAndWaitForPrompt({
    type: 'select',
    config,
  });
}

export function multiselect(config: MultiSelectPrompt['config']): Promise<string[]> {
  return setAndWaitForPrompt({
    type: 'multi-select',
    config,
  });
}
