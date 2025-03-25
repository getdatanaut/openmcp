import type { VariantProps } from 'tailwind-variants';
import { tv } from 'tailwind-variants';

import { makeStaticClass } from '../../utils/make-static-class.ts';
import { tn, twMergeConfig } from '../../utils/tw.ts';
import type { SlotProp, VariantSlots } from '../../utils/types.ts';

export type AvatarStyleProps = VariantProps<typeof avatarStyle>;
export type AvatarSlots = VariantSlots<typeof avatarStyle.slots>;
export type AvatarSlotProps = SlotProp<AvatarSlots>;

export const avatarStaticClass = makeStaticClass<AvatarSlots>('avatar');

export const avatarStyle = tv(
  {
    slots: {
      base: tn('ak-frame-xs inline-flex shrink-0 items-center justify-center overflow-hidden select-none'),
      image: tn('rounded-inherit size-full object-cover'),
      fallback: tn(
        'rounded-inherit z-0 flex size-full items-center justify-center leading-none font-medium uppercase',
        'ak-layer-mix-primary/20 ak-text-primary',
      ),
    },
    defaultVariants: {
      size: 'md',
    },
    variants: {
      size: {
        xs: tn('h-block-xs w-block-xs text-xs'),
        sm: tn('h-block-sm w-block-sm text-sm'),
        md: tn('h-block-md w-block-md text-base'),
        lg: tn('h-block-lg w-block-lg text-base'),
        xl: tn('h-block-xl w-block-xl ak-frame-lg text-lg'),
        '2xl': tn('h-block-2xl w-block-2xl ak-frame-xl text-xl'),
      },
    },
  },
  {
    twMergeConfig,
  },
);
