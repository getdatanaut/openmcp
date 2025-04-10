import * as AK from '@ariakit/react';
import { useLayoutEffect, useState } from 'react';

import type { HTMLProps } from '../../utils/types.ts';
import {
  MenuSearchGroupingContext,
  useMenuInternalContext,
  useMenuSearchContext,
  useMenuSearchGroupingContext,
} from './menu.context.ts';
import { menuStaticClass } from './menu.styles.ts';

export interface MenuGroupProps
  extends Omit<AK.MenuGroupOptions, 'onChange' | 'defaultValue' | 'defaultChecked'>,
    Pick<HTMLProps<'div'>, 'className' | 'children'> {
  label?: string;

  /**
   * A unique name for the group within the menu.
   *
   * Must provide this or the label prop (label is displayed, name is used for state management)
   */
  name?: string;

  ref?: React.Ref<HTMLDivElement>;
}

export function MenuGroup({ ref, label, name, className, ...props }: MenuGroupProps) {
  const { setList: parentSetList, groupIsMatched: parentGroupIsMatched } = useMenuSearchGroupingContext() || {};

  const { slots, classNames, searchable } = useMenuInternalContext();
  const { value: searchValue } = useMenuSearchContext() || {};

  const [list, setList] = useState<string[]>([]);

  const groupIsMatched =
    parentGroupIsMatched || Boolean(searchValue && label && label.toLowerCase().includes(searchValue.toLowerCase()));
  const noChildMatches = searchValue && !list.length;

  // // Add group to parent list when it mounts, remove it when it unmounts.
  const itemId = name || label;
  useLayoutEffect(() => {
    if (!searchable || !parentSetList || !itemId || noChildMatches) return;

    parentSetList(list => [...list, itemId]);

    return () => {
      parentSetList(list => list.filter(v => v !== itemId));
    };
  }, [parentSetList, itemId, searchable, noChildMatches]);

  const baseTw = slots.group({
    class: [menuStaticClass('group'), className, classNames?.group, noChildMatches && 'hidden'],
  });
  const labelTw = slots.groupTitle({ class: [menuStaticClass('groupTitle'), classNames?.groupTitle] });

  return (
    <MenuSearchGroupingContext.Provider value={{ groupLabel: label, groupIsMatched, setList }}>
      <AK.MenuGroup ref={ref} {...props} className={baseTw}>
        {label && <AK.MenuGroupLabel className={labelTw}>{label}</AK.MenuGroupLabel>}
        {props.children}
      </AK.MenuGroup>
    </MenuSearchGroupingContext.Provider>
  );
}
