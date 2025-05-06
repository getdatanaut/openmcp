import { setAndWaitForPrompt } from './state.ts';
import type { ConfirmPrompt } from './types.ts';

export default function confirm(config: ConfirmPrompt['config']): Promise<boolean> {
  return setAndWaitForPrompt({
    type: 'confirm',
    config,
  });
}
