import * as AK from '@ariakit/react';
import { type ReactNode, type Ref, useId } from 'react';

import { usePrevious } from '../../hooks/use-previous.ts';
import { useTabsInternalContext } from './tabs.context.ts';
import { tabsStaticClass } from './tabs.styles.ts';

type AkProps = AK.TabPanelOptions;

export interface TabPanelProps extends AkProps {
  className?: string;
  children?: ReactNode;
  ref?: Ref<HTMLDivElement>;
}

export function TabPanel({ className, ref, ...props }: TabPanelProps) {
  const { slots, classNames } = useTabsInternalContext();

  const panelTw = slots.panel({ class: [tabsStaticClass('panel'), className, classNames?.panel] });

  const tab = AK.useTabContext();
  if (!tab) throw new Error('TabPanel must be wrapped in a Tabs component');

  const defaultId = useId();
  const id = props.id ?? defaultId;
  const tabId = AK.useStoreState(tab, () => props.tabId ?? tab.panels.item(id)?.tabId);
  const previousTabId = usePrevious(AK.useStoreState(tab, 'selectedId'));
  const wasOpen = tabId && previousTabId === tabId;

  return (
    <AK.TabPanel
      ref={ref}
      id={id}
      tabId={tabId}
      tabIndex={-1} // Just allow focus to pass through to whatever is tabbable inside of the panel
      {...props}
      data-was-open={wasOpen || undefined}
      className={panelTw}
    />
  );
}
