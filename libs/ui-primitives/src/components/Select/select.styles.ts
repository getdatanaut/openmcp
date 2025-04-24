import type { VariantProps } from 'tailwind-variants';
import { tv } from 'tailwind-variants';

import { listBoxStyle } from '../../utils/list-box.styles.ts';
import { makeStaticClass } from '../../utils/make-static-class.ts';
import { tn, twMergeConfig } from '../../utils/tw.ts';
import type { SlotProp, VariantSlots } from '../../utils/types.ts';

export type SelectStyleProps = VariantProps<typeof selectStyle>;
export type SelectSlots = VariantSlots<typeof selectStyle.slots & typeof listBoxStyle.slots>;
export type SelectSlotProps = SlotProp<SelectSlots>;

export const selectStaticClass = makeStaticClass<SelectSlots>('select');

export const selectStyle = tv(
  {
    extend: listBoxStyle,

    slots: {
      base: tn('group flex flex-col place-items-start gap-1'),
      list: tn('max-h-[min(var(--popover-available-height,400px),400px)] min-w-[--popover-anchor-width]'),
    },

    variants: {
      size: {},

      renderInline: {
        true: tn('inline-flex'),
      },
    },
  },
  {
    twMergeConfig,
  },
);
