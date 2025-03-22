import type { VariantProps } from 'tailwind-variants';
import { tv } from 'tailwind-variants';

import { makeStaticClass } from '../../utils/make-static-class.ts';
import { tn, twMergeConfig } from '../../utils/tw.ts';
import type { SlotProp, VariantSlots } from '../../utils/types.ts';

export type KeyboardStyleProps = VariantProps<typeof keyboardStyle>;
export type KeyboardSlots = VariantSlots<typeof keyboardStyle.slots>;
export type KeyboardSlotProps = SlotProp<KeyboardSlots>;

export const keyboardStaticClass = makeStaticClass<KeyboardSlots>('keyboard');

export const keyboardStyle = tv(
  {
    slots: {
      base: tn(),
    },
    defaultVariants: {},
    variants: {},
  },
  {
    twMergeConfig,
  },
);
