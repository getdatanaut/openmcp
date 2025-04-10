import { type ReactNode, type Ref } from 'react';

import { useTabsInternalContext } from './tabs.context.ts';
import { tabsStaticClass } from './tabs.styles.ts';

export interface TabPanelsProps {
  className?: string;
  children?: ReactNode;
  ref?: Ref<HTMLDivElement>;
}

export function TabPanels({ className, ref, ...props }: TabPanelsProps) {
  const { slots, classNames } = useTabsInternalContext();

  const panelsTw = slots.panels({ class: [tabsStaticClass('panels'), className, classNames?.panels] });

  return <div ref={ref} {...props} className={panelsTw} />;
}
