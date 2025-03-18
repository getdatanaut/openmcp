import type { VariantProps } from 'tailwind-variants';
import { tv } from 'tailwind-variants';

import { makeStaticClass } from '../../utils/make-static-class.ts';
import { tn, twMergeConfig } from '../../utils/tw.ts';
import type { SlotProp, VariantSlots } from '../../utils/types.ts';

export type FormStyleProps = VariantProps<typeof formStyle>;
export type FormSlots = VariantSlots<typeof formStyle.slots>;
export type FormSlotProps = SlotProp<FormSlots>;

export const formStaticClass = makeStaticClass<FormSlots>('form');

export const formStyle = tv(
  {
    slots: {
      base: tn('flex flex-col'),

      field: tn('flex w-full flex-col'),
      fieldHeader: tn('flex items-center justify-between gap-4'),
      fieldLabel: tn('ps-px'),
      fieldError: tn('ak-text-danger text-end text-sm'),
      fieldHint: tn('ak-text/50 ps-px text-sm'),
    },

    defaultVariants: {
      size: 'md',
    },

    variants: {
      size: {
        sm: {
          base: tn('gap-5'),
          field: tn('gap-1.5'),
          fieldError: tn('text-xs'),
          fieldHint: tn('text-xs'),
        },
        md: {
          base: tn('gap-6'),
          field: tn('gap-1.5'),
        },
        lg: {
          base: tn('gap-7'),
          field: tn('gap-2'),
        },
      },
    },
  },
  {
    twMergeConfig,
  },
);
