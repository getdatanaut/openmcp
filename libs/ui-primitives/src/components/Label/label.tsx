import type { Options } from '@ariakit/react-core/utils/types';
import { createElement, type Ref, useMemo } from 'react';

import { type ContextValue, createContext, useContextProps } from '../../utils/context.tsx';
import { splitPropsVariants } from '../../utils/split-props-variants.ts';
import type { HTMLProps } from '../../utils/types.ts';
import { type LabelSlotProps, labelStaticClass, labelStyle, type LabelStyleProps } from './label.styles.ts';

export interface LabelOptions extends Options, LabelStyleProps, LabelSlotProps {
  ref?: Ref<HTMLLabelElement>;
}

export type LabelProps = LabelOptions & HTMLProps<'label'>;

export const [LabelContext, useLabelContext] = createContext<ContextValue<LabelProps, HTMLLabelElement>>({
  name: 'LabelContext',
  strict: false,
});

export function Label({ ref, ...originalProps }: LabelProps) {
  [originalProps, ref] = useContextProps(originalProps, LabelContext, ref);

  const [{ className, ...props }, variantProps] = splitPropsVariants(originalProps, labelStyle.variantKeys);

  const slots = useMemo(() => labelStyle(variantProps), [variantProps]);

  const baseTw = slots.base({ class: [labelStaticClass('base'), className] });

  return createElement('div', { ...props, ref, className: baseTw });
}
