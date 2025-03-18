import type { VariantProps } from 'tailwind-variants';
import { tv } from 'tailwind-variants';

import { makeStaticClass } from '../../utils/make-static-class.ts';
import { tn, twMergeConfig } from '../../utils/tw.ts';
import type { SlotProp, VariantSlots } from '../../utils/types.ts';

export type LabelStyleProps = VariantProps<typeof labelStyle>;
export type LabelSlots = VariantSlots<typeof labelStyle.slots>;
export type LabelSlotProps = SlotProp<LabelSlots>;

export const labelStaticClass = makeStaticClass<LabelSlots>('label');

export const labelStyle = tv(
  {
    slots: {
      base: tn(
        `leading-trim-start w-fit cursor-default text-base font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70`,
      ),
    },

    variants: {
      size: {
        sm: {
          base: tn('text-sm'),
        },
        md: {
          base: tn('text-base'),
        },
        lg: {
          base: tn('text-lg'),
        },
      },

      disabled: {
        true: {
          base: tn('opacity-85'),
        },
      },
    },
  },
  {
    twMergeConfig,
  },
);
