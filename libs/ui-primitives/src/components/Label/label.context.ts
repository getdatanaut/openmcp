import { type ContextValue, createContext } from '../../utils/context.ts';
import type { LabelProps } from './label.tsx';

export const [LabelContext, useLabelContext] = createContext<ContextValue<LabelProps, HTMLLabelElement>>({
  name: 'LabelContext',
  strict: false,
});
