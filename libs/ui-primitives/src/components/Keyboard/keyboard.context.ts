import { type ContextValue, createContext } from '../../utils/context.ts';
import type { KeyboardProps } from './keyboard.tsx';

export const [KeyboardContext, useKeyboardContext] = createContext<ContextValue<KeyboardProps, HTMLElement>>({
  name: 'KeyboardContext',
  strict: false,
});
