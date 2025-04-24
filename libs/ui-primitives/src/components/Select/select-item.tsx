import * as AK from '@ariakit/react';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import type { SetRequired } from '@libs/utils-types';

import { tn } from '../../utils/tw.ts';
import { Icon } from '../Icon/icon.tsx';
import { useSelectInternalContext } from './select.context.tsx';
import { selectStaticClass } from './select.styles.ts';

export interface SelectItemProps extends SetRequired<AK.SelectItemProps, 'value'> {}

export function SelectItem({ className, ref, ...props }: SelectItemProps) {
  const select = AK.useSelectContext()!;
  const selectValue = AK.useStoreState(select, 'value');
  const checked = Array.isArray(selectValue) ? selectValue.includes(props.value) : selectValue === props.value;

  const { slots, classNames } = useSelectInternalContext();

  const baseTw = slots.item({ class: [selectStaticClass('item'), className, classNames?.item] });
  const contentTw = slots.itemContent({
    class: [selectStaticClass('itemContent'), classNames?.itemContent],
  });
  const indicatorTw = slots.itemIndicator({
    class: [selectStaticClass('itemIndicator'), classNames?.itemIndicator],
  });

  return (
    <AK.SelectItem {...props} ref={ref} className={baseTw} id={props.value}>
      <div className={indicatorTw} aria-hidden>
        <Icon icon={faCheck} className={tn(['mx-auto', !checked && 'invisible'])} fw />
      </div>

      <div className={contentTw}>{props.children ?? props.value}</div>
    </AK.SelectItem>
  );
}
