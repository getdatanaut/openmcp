import type { VariantProps } from 'tailwind-variants';
import { tv } from 'tailwind-variants';

import { makeStaticClass } from '../../utils/make-static-class.ts';
import { focusStyles } from '../../utils/styles.ts';
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

      panel: tn(focusStyles),
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
            'ak-text/20 selected:ak-text hover:ak-text',
            'selected:before:h-0.5',
            'selected:before:absolute',
            'selected:before:bottom-0',
            'selected:before:inset-x-0',
            'selected:before:bg-secondary',
          ),

          tabInner: tn(
            triggerInnerSharedTx,
            'group-hover:ak-layer-hover',
            'group-focus-visible:ak-edge-secondary group-focus-visible:border',
            'group-selected:font-medium',
            'group-selected:tracking-[-0.01em]',
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
