import type { VariantProps } from 'tailwind-variants';
import { tv } from 'tailwind-variants';

// import { focusStyles, inputFocusStyles } from '../../utils/focus.ts';
import { makeStaticClass } from '../../utils/make-static-class.ts';
import { tn, twMergeConfig } from '../../utils/tw.ts';
import type { SlotProp, VariantSlots } from '../../utils/types.ts';

export type ButtonStyleProps = VariantProps<typeof buttonStyle>;
export type ButtonSlots = VariantSlots<typeof buttonStyle.slots>;
export type ButtonSlotProps = SlotProp<ButtonSlots>;

export const buttonStaticClass = makeStaticClass<ButtonSlots>('button');

export const buttonStyle = tv(
  {
    slots: {
      base: tn(
        `group ak-frame-xs placeholder-shown:text-muted relative inline-flex max-w-full cursor-pointer appearance-none items-center justify-center font-medium whitespace-nowrap select-none motion-safe:transition`,
      ),

      icon: tn('[display:inherit]'),

      endIcon: tn('[display:inherit] text-[0.9em]'),

      text: tn('truncate py-0.5 leading-none'),
    },
    defaultVariants: {
      size: 'md',
      variant: 'solid',
      intent: 'neutral',
      fullWidth: false,
      disabled: false,
      isLoading: false,
      isInteractive: true,
    },
    variants: {
      variant: {
        solid: {},
        soft: {},
        outline: {},
        ghost: {},
      },
      intent: {
        neutral: {},
        primary: {},
        danger: {},
      },
      size: {
        xs: {
          base: tn('h-6 gap-1 px-1.5 text-sm font-normal'),
          icon: tn('text-[0.9em]'),
        },
        sm: {
          base: tn('h-8 gap-1 px-2.5 text-sm font-normal'),
          icon: tn('text-[0.9em]'),
        },
        md: tn('h-10 gap-1.5 px-3.5'),
        lg: tn('ak-frame h-12 gap-2 px-5'),
      },
      fullWidth: {
        true: tn('w-full'),
      },
      disabled: {
        true: tn('pointer-events-none opacity-50 select-none'),
      },
      input: {
        // true: tn('font-normal', inputFocusStyles),
        // false: tn(focusStyles),
        true: tn('font-normal', ''),
        false: tn(''),
      },
      isLoading: {
        true: tn('pointer-events-none opacity-80 select-none'),
      },
      isInteractive: {
        true: tn(''),
        false: tn('cursor-default'),
      },
    },
    compoundVariants: [
      // solid / intent
      {
        variant: 'solid',
        intent: 'neutral',
        class: tn('ak-layer-contrast'),
      },
      {
        variant: 'solid',
        intent: 'primary',
        class: tn('ak-layer-contrast-primary'),
      },
      {
        variant: 'solid',
        intent: 'danger',
        class: tn('ak-layer-contrast-danger'),
      },

      // outline / intent
      {
        variant: 'outline',
        intent: 'neutral',
        class: tn('border'),
      },
      {
        variant: 'outline',
        intent: 'primary',
        class: tn('ak-edge-contrast-primary text-primary border'),
      },
      {
        variant: 'outline',
        intent: 'danger',
        class: tn('ak-edge-contrast-danger text-danger border'),
      },

      // soft / intent
      {
        variant: 'soft',
        intent: 'neutral',
        class: tn('ak-light:ak-layer-down ak-dark:ak-layer'),
      },
      {
        variant: 'soft',
        intent: 'primary',
        class: tn('ak-layer-mix-primary/20'),
      },
      {
        variant: 'soft',
        intent: 'danger',
        class: tn('ak-layer-mix-danger/20'),
      },

      // ghost / intent
      {
        variant: 'ghost',
        intent: 'neutral',
        class: tn(''),
      },
      {
        variant: 'ghost',
        intent: 'primary',
        class: tn('ak-text-primary'),
      },
      {
        variant: 'ghost',
        intent: 'danger',
        class: tn('ak-text-danger'),
      },

      // intent / isInteractive
      {
        variant: ['solid', 'soft'],
        disabled: false,
        isLoading: false,
        isInteractive: true,
        class: tn('hover:ak-layer-pop active:ak-layer-pop-2'),
      },
      {
        variant: ['outline', 'ghost'],
        disabled: false,
        isLoading: false,
        isInteractive: true,
        class: tn('active:ak-layer-pop-2'),
      },
      {
        variant: ['outline', 'ghost'],
        intent: 'neutral',
        disabled: false,
        isLoading: false,
        isInteractive: true,
        class: tn('ak-light:hover:ak-layer-down ak-light:active:ak-layer-pop-2 hover:ak-layer'),
      },
      {
        variant: ['outline', 'ghost'],
        intent: 'primary',
        disabled: false,
        isLoading: false,
        isInteractive: true,
        class: tn('hover:ak-layer-mix-primary/20'),
      },
      {
        variant: ['outline', 'ghost'],
        intent: 'danger',
        disabled: false,
        isLoading: false,
        isInteractive: true,
        class: tn('hover:ak-layer-mix-danger/20'),
      },
    ],
  },
  {
    twMergeConfig,
  },
);

/**
 * ButtonGroup
 */

export type ButtonGroupStyleProps = VariantProps<typeof buttonGroupStyle>;
export type ButtonGroupSlots = VariantSlots<typeof buttonGroupStyle.slots>;
export type ButtonGroupSlotProps = SlotProp<ButtonGroupSlots>;

export const buttonGroupStaticClass = makeStaticClass<ButtonGroupSlots>('button-group');

export const buttonGroupStyle = tv(
  {
    slots: {
      base: tn('flex'),
    },
    variants: {
      fullWidth: {
        true: tn('w-full'),
      },
      isAttached: {
        true: tn(
          // ... These are ugly - COULD move them to dedicated classes in the tailwind plugin... but not a huge deal.
          '[&>_*:first-of-type:not(:last-of-type)]:rounded-e-none',
          '[&>_*:not(:first-of-type):not(:last-of-type)]:rounded-none',
          '[&>_*:not(:first-of-type):last-of-type]:rounded-s-none',
          '[&>_*:not(:last-of-type)]:-me-px',
        ),
        false: tn('gap-2'),
      },
    },
    defaultVariants: {
      fullWidth: false,
      isAttached: false,
    },
  },
  {
    twMergeConfig,
  },
);
