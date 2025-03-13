import type { VariantProps } from 'tailwind-variants';
import { tv } from 'tailwind-variants';

import { makeStaticClass } from '../../utils/make-static-class.ts';
import { tn, twMergeConfig } from '../../utils/tw.ts';
import type { SlotProp, VariantSlots } from '../../utils/types.ts';

export type IconStyleProps = VariantProps<typeof iconStyle>;
export type IconSlots = VariantSlots<typeof iconStyle.slots>;
export type IconSlotProps = SlotProp<IconSlots>;

export const iconStaticClass = makeStaticClass<IconSlots>('icon');

export const iconStyle = tv(
  {
    slots: {
      base: tn('h-[1em] !leading-none'),
    },

    defaultVariants: {
      fw: false,
      spin: false,
      ping: false,
      pulse: false,
      bounce: false,
    },

    variants: {
      fw: {
        true: tn('w-[1.25em] text-center'),
      },

      spin: {
        true: tn('fa-spin'),
      },

      ping: {
        true: tn('animate-ping'),
      },

      pulse: {
        true: tn('fa-pulse'),
      },

      bounce: {
        true: tn('fa-bounce'),
      },
    },
  },
  {
    twMergeConfig,
  },
);
