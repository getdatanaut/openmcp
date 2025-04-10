import { type ContextValue, createContext } from '../../utils/context.ts';
import type { ButtonProps } from './button.tsx';

export const [ButtonContext, useButtonContext] = createContext<ContextValue<ButtonProps, HTMLButtonElement>>({
  name: 'ButtonContext',
  strict: false,
});
