import { type ContextValue, createContext } from '../../utils/context.ts';
import type { HeadingProps } from './heading.tsx';

export const [HeadingContext, useHeadingContext] = createContext<ContextValue<HeadingProps, HTMLHeadingElement>>({
  name: 'HeadingContext',
  strict: false,
});
