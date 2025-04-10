import { createElement } from '@ariakit/react-core/utils/system';
import type { Options } from '@ariakit/react-core/utils/types';
import { type Ref, useMemo } from 'react';

import { useContextProps } from '../../utils/context.ts';
import { splitPropsVariants } from '../../utils/split-props-variants.ts';
import type { HTMLProps } from '../../utils/types.ts';
import { HeadingContext } from './heading.context.ts';
import { type HeadingSlotProps, headingStaticClass, headingStyle, type HeadingStyleProps } from './heading.styles.ts';

export interface HeadingOptions extends Options, HeadingStyleProps, HeadingSlotProps {}

export interface HeadingProps extends HeadingOptions, Pick<HTMLProps<'h1'>, 'className' | 'title' | 'children'> {
  slot?: string;
  ref?: Ref<HTMLHeadingElement>;
}

export function Heading({ ref, ...originalProps }: HeadingProps) {
  [originalProps, ref] = useContextProps(originalProps, HeadingContext, ref);

  const [{ className, ...props }, variantProps] = splitPropsVariants(originalProps, headingStyle.variantKeys);

  const slots = useMemo(() => headingStyle(variantProps), [variantProps]);

  const baseTw = slots.base({ class: [headingStaticClass('base'), className] });

  return createElement('h1', { ...props, ref, className: baseTw });
}
