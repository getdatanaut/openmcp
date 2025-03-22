import * as AK from '@ariakit/react';

import type { HTMLProps } from '../../utils/types.ts';
import { useMenuInternalContext, useMenuSearchContext } from './internal-context.tsx';
import { menuStaticClass } from './menu.styles.ts';

export interface MenuSeparatorProps extends AK.MenuSeparatorOptions, Pick<HTMLProps<'hr'>, 'className'> {
  ref?: React.Ref<HTMLHRElement>;
}

export function MenuSeparator({ className, ...props }: MenuSeparatorProps) {
  const { value: searchValue } = useMenuSearchContext() || {};
  const { slots, classNames } = useMenuInternalContext();

  if (searchValue) return null;

  const baseTw = slots.separator({ class: [menuStaticClass('separator'), className, classNames?.separator] });

  return <AK.MenuSeparator {...props} className={baseTw} />;
}
