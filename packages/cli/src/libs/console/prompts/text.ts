import { setAndWaitForPrompt } from './state.ts';
import type { TextPrompt } from './types.ts';

export function text(config: TextPrompt['config']): Promise<string> {
  return setAndWaitForPrompt({
    type: 'text',
    config,
  });
}

export function maskedText(config: Omit<TextPrompt['config'], 'mask'>) {
  return text({
    ...config,
    mask: '*',
  });
}
