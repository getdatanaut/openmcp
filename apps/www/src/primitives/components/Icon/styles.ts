import type { VariantProps } from 'tailwind-variants';
import { tv } from 'tailwind-variants';

import { makeStaticClass } from '../../make-static-class.ts';
import { twJoin, twMergeConfig } from '../../tw.ts';
import type { SlotProp, VariantSlots } from '../../types.ts';

export type IconStyleProps = VariantProps<typeof iconStyle>;
export type IconSlots = VariantSlots<typeof iconStyle.slots>;
export type IconSlotProps = SlotProp<IconSlots>;

export const iconStaticClass = makeStaticClass<IconSlots>('icon');

export const iconStyle = tv(
  {
    slots: {
      base: twJoin('h-[1em] !leading-none'),
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
        true: twJoin('w-[1.25em] text-center'),
      },

      spin: {
        true: twJoin('animate-spin-slow'),
      },

      ping: {
        true: twJoin('animate-ping'),
      },

      pulse: {
        true: twJoin('animate-pulse'),
      },

      bounce: {
        true: twJoin('animate-bounce'),
      },
    },
  },
  {
    twMergeConfig,
  },
);
