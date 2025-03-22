import type { Options } from '@ariakit/react-core/utils/types';
import { createElement, useMemo } from 'react';

import { type ContextValue, createContext, useContextProps } from '../../utils/context.tsx';
import { splitPropsVariants } from '../../utils/split-props-variants.ts';
import type { HTMLProps } from '../../utils/types.ts';
import { keyboardStaticClass, keyboardStyle } from './keyboard.styles.ts';

export interface KeyboardOptions extends Options {
  ref?: React.Ref<HTMLElement>;
}

export interface KeyboardProps extends KeyboardOptions, Pick<HTMLProps<'kbd'>, 'className'> {}

export const [KeyboardContext, useKeyboardContext] = createContext<ContextValue<KeyboardProps, HTMLElement>>({
  name: 'KeyboardContext',
  strict: false,
});

export function Keyboard({ ref, ...originalProps }: KeyboardProps) {
  [originalProps, ref] = useContextProps(originalProps, KeyboardContext, ref);

  const [{ className, ...props }, variantProps] = splitPropsVariants(originalProps, keyboardStyle.variantKeys);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const slots = useMemo(() => keyboardStyle(variantProps), Object.values(variantProps));

  const baseTw = slots.base({ class: [keyboardStaticClass('base'), className] });

  return createElement('kbd', { ...props, dir: 'ltr', ref, className: baseTw });
}
