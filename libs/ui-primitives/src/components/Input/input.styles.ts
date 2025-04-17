import type { VariantProps } from 'tailwind-variants';
import { tv } from 'tailwind-variants';

import { makeStaticClass } from '../../utils/make-static-class.ts';
import { formSizes, inputFocusStyles } from '../../utils/styles.ts';
import { tn, twMergeConfig } from '../../utils/tw.ts';
import type { SlotProp, VariantSlots } from '../../utils/types.ts';

export type InputStyleProps = VariantProps<typeof inputStyle>;
export type InputSlots = VariantSlots<typeof inputStyle.slots>;
export type InputSlotProps = SlotProp<InputSlots>;

export const inputStaticClass = makeStaticClass<InputSlots>('input');

const inputStyles = tn(
  'ak-frame placeholder:text-muted ak-layer-0 w-full appearance-none',
  'disabled:cursor-not-allowed disabled:opacity-50',
  inputFocusStyles,
);

const baseIconStyles = tn('text-muted pointer-events-none absolute inset-y-0 flex items-center justify-center');

export const inputStyle = tv(
  {
    slots: {
      base: tn('group relative flex items-center'),
      input: tn(''),
      textarea: tn(''),
      startIcon: tn(baseIconStyles, 'left-0'),
      endIcon: tn(baseIconStyles, 'right-0'),
      startSection: tn('absolute inset-y-0 left-0 flex items-center'),
      endSection: tn('absolute inset-y-0 right-0 flex items-center'),
    },

    defaultVariants: {
      variant: 'outline',
      size: 'md',
      isDisabled: false,
    },

    variants: {
      variant: {
        outline: {
          input: tn('ak-edge-1/20 border', inputStyles),
          textarea: tn(inputStyles, 'h-full resize'),
        },
        ghost: {
          input: tn('hover:ak-edge-1/20 border border-transparent', inputStyles),
          textarea: tn(inputStyles, 'h-full resize'),
        },
        unstyled: {
          input: tn('outline-none'),
          textarea: tn('outline-none'),
        },
      },

      size: {
        sm: {
          input: formSizes.sm,
          startIcon: tn('w-8 text-xs'),
          endIcon: tn('w-8 text-sm'),
        },
        md: {
          input: formSizes.md,
          startIcon: tn('w-9 text-base'),
          endIcon: tn('w-9 text-base'),
        },
        lg: {
          input: formSizes.lg,
          startIcon: tn('w-11 text-base'),
          endIcon: tn('w-11 text-base'),
        },
      },

      isDisabled: { true: tn() },
      hasStartIcon: { true: tn() },
      hasEndIcon: { true: tn() },
      hasSection: { true: tn() },
    },

    compoundSlots: [
      {
        slots: ['startIcon', 'endIcon'],
        isDisabled: true,
        class: tn('pointer-events-none opacity-50'),
      },
    ],

    compoundVariants: [
      // icon + size + input
      {
        hasStartIcon: true,
        size: 'sm',
        class: {
          input: tn('pl-7'),
        },
      },
      {
        hasStartIcon: true,
        size: 'md',
        class: {
          input: tn('pl-8'),
        },
      },
      {
        hasStartIcon: true,
        size: 'lg',
        class: {
          input: tn('pl-10'),
        },
      },
      {
        hasEndIcon: true,
        size: 'sm',
        class: {
          input: tn('pr-7'),
        },
      },
      {
        hasEndIcon: true,
        size: 'md',
        class: {
          input: tn('pr-8'),
        },
      },
      {
        hasEndIcon: true,
        size: 'lg',
        class: {
          input: tn('pr-10'),
        },
      },
    ],
  },
  {
    twMergeConfig,
  },
);
