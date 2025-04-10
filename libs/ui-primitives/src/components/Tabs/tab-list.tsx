import * as AK from '@ariakit/react';
import { type ReactNode, type Ref } from 'react';

import { useTabsInternalContext } from './tabs.context.ts';
import { tabsStaticClass } from './tabs.styles.ts';

type AKProps = AK.TabListOptions;

export interface TabListProps extends AKProps {
  className?: string;
  children?: ReactNode;
  ref?: Ref<HTMLDivElement>;
}

export function TabList({ className, ref, ...props }: TabListProps) {
  const { slots, classNames } = useTabsInternalContext();

  const listTw = slots.list({ class: [tabsStaticClass('list'), className, classNames?.list] });

  return <AK.TabList ref={ref} {...props} className={listTw} />;
}
