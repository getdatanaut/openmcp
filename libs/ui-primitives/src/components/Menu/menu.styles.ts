import { tv, type VariantProps } from 'tailwind-variants';

import { listBoxStyle } from '../../utils/list-box.styles.ts';
import { makeStaticClass } from '../../utils/make-static-class.ts';
import { tn, twMergeConfig } from '../../utils/tw.ts';
import type { SlotProp, VariantSlots } from '../../utils/types.ts';

export type MenuStyleProps = VariantProps<typeof menuStyle>;
export type MenuSlots = VariantSlots<typeof menuStyle.slots & typeof listBoxStyle.slots>;
export type MenuSlotProps = SlotProp<MenuSlots>;

export const menuStaticClass = makeStaticClass<MenuSlots>('menu');

export const menuStyle = tv(
  {
    extend: listBoxStyle,

    slots: {
      comboboxWrapper: tn('ak-layer-0 sticky top-0 z-10 pb-2', '[&~*]:[--combobox-height:theme(spacing.11)]'),
    },

    variants: {
      size: {},
    },
  },
  {
    twMergeConfig,
  },
);
