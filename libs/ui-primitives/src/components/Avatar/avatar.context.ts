import { type ContextValue, createContext } from '../../utils/context.ts';
import type { AvatarProps } from './avatar.tsx';

export const [AvatarContext, useAvatarContext] = createContext<ContextValue<AvatarProps, HTMLSpanElement>>({
  name: 'AvatarContext',
  strict: false,
});
