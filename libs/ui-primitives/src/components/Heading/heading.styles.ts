import type { VariantProps } from 'tailwind-variants';
import { tv } from 'tailwind-variants';

import { makeStaticClass } from '../../utils/make-static-class.ts';
import { tn, twMergeConfig } from '../../utils/tw.ts';
import type { SlotProp, VariantSlots } from '../../utils/types.ts';

export type HeadingStyleProps = VariantProps<typeof headingStyle>;
export type HeadingSlots = VariantSlots<typeof headingStyle.slots>;
export type HeadingSlotProps = SlotProp<HeadingSlots>;

export const headingStaticClass = makeStaticClass<HeadingSlots>('heading');

export const headingStyle = tv(
  {
    slots: {
      base: tn(''),
    },
    defaultVariants: {
      size: 6,
    },
    variants: {
      size: {
        1: tn('text-sm font-medium'),
        2: tn('text-base font-medium'),
        3: tn('text-lg font-medium'),
        4: tn('text-xl font-medium'),
        5: tn('text-2xl font-semibold'),
        6: tn('text-3xl font-bold'),
        7: tn('text-4xl font-bold'),
        8: tn('text-5xl font-extrabold'),
        9: tn('text-7xl font-extrabold'),
      },
    },
  },
  {
    twMergeConfig,
  },
);
