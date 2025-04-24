import * as AK from '@ariakit/react';

import { useSelectInternalContext } from './select.context.tsx';
import { selectStaticClass } from './select.styles.ts';

export interface SelectGroupProps extends AK.SelectGroupProps {}

export function SelectGroup({ className, title, ref, ...props }: SelectGroupProps) {
  const { slots, classNames } = useSelectInternalContext();

  const baseTw = slots.group({ class: [selectStaticClass('group'), className, classNames?.group] });
  const titleTw = slots.groupTitle({
    class: [selectStaticClass('groupTitle'), classNames?.groupTitle],
  });

  return (
    <AK.SelectGroup ref={ref} className={baseTw} {...props}>
      {title && <AK.SelectGroupLabel className={titleTw}>{title}</AK.SelectGroupLabel>}

      {props.children}
    </AK.SelectGroup>
  );
}
