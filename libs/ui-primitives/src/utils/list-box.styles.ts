import { tv } from 'tailwind-variants';

import { tn, twMergeConfig } from './tw.ts';

/**
 * Base styles for all list-box style components (Select, Menu, etc).
 *
 * Contains a superset of slots for the generic list-box use case.
 */
export const listBoxStyle = tv(
  {
    slots: {
      popover: tn('ak-layer animate-popper z-30 border-[0.5px] outline-none'),
      arrow: tn('fill-[var(--ak-layer)] stroke-[var(--ak-border)] stroke-2'),

      list: tn(
        'h-full overflow-auto overscroll-contain',
        'max-h-[min(500px,var(--popover-available-height))] min-w-[max(180px,var(--popover-anchor-width))]',
      ),

      item: tn(
        `active:ak-layer-pop-[1.5] ak-frame flex cursor-default items-center outline-none select-none disabled:pointer-events-none disabled:opacity-40`,

        /**
         * We are using sticky for group titles and combo box inputs.
         * This ensures that the scroll snaps up/down enough to show the item when user is scrolling
         * via keyboard to top or bottom of the scrollport.
         */
        'scroll-m-2 scroll-mt-[calc(var(--combobox-height,_0px)+var(--label-height,_32px))]',
      ),

      itemIndicator: tn('pointer-events-none flex items-center text-[0.8em]'),
      itemStartIcon: tn('flex items-center text-[0.85em] leading-none'),
      itemContent: tn('flex flex-1 truncate pr-6'),
      itemEndIcon: tn('ms-auto text-[0.75em] opacity-80'),
      itemShortcut: tn('ms-auto text-[0.75em] tracking-widest opacity-60'),

      group: tn(),
      groupTitle: tn(
        `ak-layer-0 ak-text/50 sticky -top-1.5 truncate py-1.5 text-sm font-light tracking-tight uppercase select-none`,
      ),

      separator: tn('ak-layer-[0.5] h-px'),
    },

    defaultVariants: {
      size: 'md',
    },

    variants: {
      size: {
        sm: {
          popover: tn('ak-frame-xs shadow-2xs'),
          list: tn('p-1.5 text-sm'),
          item: tn('h-7 gap-1 px-1.5'),
          group: tn(),
          groupTitle: tn('px-1.5', 'text-xs'),
          separator: tn('mx-1 my-1.5'),
        },
        md: {
          popover: tn('ak-frame-sm shadow-xs'),
          list: tn('p-1.5 text-base'),
          item: tn('h-8 gap-2 px-2'),
          group: tn(),
          groupTitle: tn('px-2'),
          separator: tn('mx-1 my-1.5'),
        },
        lg: {
          popover: tn('ak-frame-md shadow-sm'),
          list: tn('p-2 text-base'),
          item: tn('h-9 gap-2 px-2.5'),
          group: tn(),
          groupTitle: tn('px-2.5'),
          separator: tn('mx-1.5 my-2'),
        },
      },
    },
  },
  {
    twMergeConfig,
  },
);
