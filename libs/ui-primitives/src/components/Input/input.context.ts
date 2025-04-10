import { type ContextValue, createContext } from '../../utils/context.ts';
import type { InputProps } from './input.tsx';

export const [InputContext, useInputContext] = createContext<ContextValue<InputProps, HTMLInputElement>>({
  name: 'InputContext',
  strict: false,
});
