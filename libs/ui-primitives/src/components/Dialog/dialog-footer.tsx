import { createElement } from '@ariakit/react-core/utils/system';
import type { Options } from '@ariakit/react-core/utils/types';
import { type ReactNode, type Ref } from 'react';

import { dialogStaticClass } from './dialog.styles.ts';
import { useDialogInternalContext } from './internal-context.tsx';

export interface DialogFooterProps extends Options {
  className?: string;
  children?: ReactNode;
  ref?: Ref<HTMLDivElement>;
}

export function DialogFooter(props: DialogFooterProps) {
  const { className, ref, ...others } = props;

  const { slots, classNames } = useDialogInternalContext();

  const baseTw = slots.footer({ class: [dialogStaticClass('footer'), className, classNames?.footer] });

  return createElement('div', { ...others, ref, className: baseTw });
}
