import type { VariantProps } from 'tailwind-variants';
import { tv } from 'tailwind-variants';

import { makeStaticClass } from '../../utils/make-static-class.ts';
import { tn, twMergeConfig } from '../../utils/tw.ts';
import type { SlotProp, VariantSlots } from '../../utils/types.ts';

export type DialogStyleProps = VariantProps<typeof dialogStyle>;
export type DialogSlots = VariantSlots<typeof dialogStyle.slots>;
export type DialogSlotProps = SlotProp<DialogSlots>;

export const dialogStaticClass = makeStaticClass<DialogSlots>('dialog');

export const dialogStyle = tv(
  {
    slots: {
      wrapper: tn('fixed inset-0 isolate flex h-[100dvh] w-screen justify-center'),

      base: tn(
        'ak-frame-md/8 ak-layer-[0.5] ak-edge/5 ak-frame-border-[0.5px] bg-clip-padding shadow-sm outline-none',
        'animate-dialog-content',
        'flex w-full flex-col',
        'mx-6 my-16 max-sm:m-1.5',
      ),

      backdrop: tn('animate-overlay fixed inset-0'),

      header: tn('-mx-8 -mt-8 px-6 py-5'),
      body: tn('-mx-8 px-6 py-2'),
      footer: tn('-mx-8 -mb-8 flex flex-row justify-end gap-3 px-6 py-5'),
      close: tn('absolute top-1 right-1'),
    },

    defaultVariants: {
      size: 'md',
      placement: 'auto',
      scrollBehavior: 'inside',
      backdrop: 'opaque',
    },

    variants: {
      size: {
        xs: {
          base: tn('max-w-xs'),
        },
        sm: {
          base: tn('max-w-sm'),
        },
        md: {
          base: tn('max-w-md'),
        },
        lg: {
          base: tn('max-w-lg'),
        },
        xl: {
          base: tn('max-w-xl'),
        },
        '2xl': {
          base: tn('max-w-2xl'),
        },
        '3xl': {
          base: tn('max-w-3xl'),
        },
        '4xl': {
          base: tn('max-w-4xl'),
        },
        '5xl': {
          base: tn('max-w-5xl'),
        },
        full: {
          base: tn('ak-frame-none m-0 h-[100dvh] max-w-full max-sm:m-0'),
        },
      },

      placement: {
        auto: {
          wrapper: tn('items-center max-sm:items-end'),
        },
      },

      scrollBehavior: {
        inside: {
          wrapper: tn('overflow-y-hidden'),
          base: tn('max-h-[calc(100%_-_7.5rem)]'),
          body: tn('overflow-y-auto'),
        },
        outside: {
          wrapper: tn('items-start overflow-y-auto max-sm:items-start'),
          base: tn('my-16'),
        },
      },

      backdrop: {
        transparent: {
          backdrop: tn('hidden'),
        },
        opaque: {
          backdrop: tn('bg-canvas/90 saturate-40'),
        },
        blur: {
          backdrop: tn('bg-canvas/70 saturate-40 backdrop-blur-xs'),
        },
      },
    },
  },
  {
    twMergeConfig,
  },
);
