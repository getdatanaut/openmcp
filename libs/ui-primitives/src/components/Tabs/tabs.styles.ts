import type { VariantProps } from 'tailwind-variants';
import { tv } from 'tailwind-variants';

import { makeStaticClass } from '../../utils/make-static-class.ts';
import { tn, twMergeConfig } from '../../utils/tw.ts';
import type { SlotProp, VariantSlots } from '../../utils/types.ts';

export type TabsStyleProps = VariantProps<typeof tabsStyle>;
export type TabsSlots = VariantSlots<typeof tabsStyle.slots>;
export type TabsSlotProps = SlotProp<TabsSlots>;

export const tabsStaticClass = makeStaticClass<TabsSlots>('tabs');

const triggerInnerSharedTx = tn('flex items-center justify-center', 'ak-frame-xs px-1.5');

export const tabsStyle = tv(
  {
    slots: {
      list: tn(),

      tab: tn('group'),

      tabInner: tn('absolute'),

      tabInnerHidden: tn('invisible'),

      panels: tn(),

      panel: tn(), // focusStyles
    },

    defaultVariants: {
      animate: false,
      variant: 'line',
    },

    variants: {
      variant: {
        unstyled: {},

        line: {
          list: tn('flex h-10 gap-2 overflow-x-auto whitespace-nowrap'),

          tab: tn(
            'relative flex shrink-0 cursor-default items-center justify-center outline-none select-none',
            'px-1.5 text-base',
            // @TODO
            // 'text-muted aria-selected:text-fg hover:text-fg',
            'ak-text/20',
            'aria-selected:before:h-[2px]',
            'aria-selected:before:absolute',
            'aria-selected:before:bottom-0',
            'aria-selected:before:inset-x-0',
            'aria-selected:before:ak-layer-primary',
          ),

          tabInner: tn(
            triggerInnerSharedTx,
            'group-hover:ak-layer',
            // 'group-focus-visible:ak-edge-primary group-focus-visible:shadow-[0_0_0_2px]',
            'group-aria-selected:font-medium',
            'group-aria-selected:tracking-[-0.01em]',
          ),

          /**
           * Separate hidden from inner so that there is no horizontal shifting on screen
           * as user changes active tab and amount of bold text changes
           */
          tabInnerHidden: tn(triggerInnerSharedTx, 'font-medium'),

          panels: tn('px-3.5 py-3'),
        },
      },
    },
  },
  {
    twMergeConfig,
  },
);
