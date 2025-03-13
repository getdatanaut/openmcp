import * as AK from '@ariakit/react';
import { type ReactNode, type Ref } from 'react';

import { useTabsInternalContext } from './internal-context.tsx';
import { tabsStaticClass } from './tabs.styles.ts';

type AKProps = AK.TabOptions;

export interface TabProps extends AKProps {
  ref?: Ref<HTMLButtonElement>;
  className?: string;
  children?: ReactNode;
}

export function Tab({ className, children, ref, ...props }: TabProps) {
  const { slots, classNames } = useTabsInternalContext();

  const tabTw = slots.tab({ class: [tabsStaticClass('tab'), className, classNames?.tab] });
  const tabInnerTw = slots.tabInner({ class: [tabsStaticClass('tabInner'), classNames?.tabInner] });
  const tabInnerHiddenTw = slots.tabInnerHidden({
    class: [tabsStaticClass('tabInnerHidden'), classNames?.tabInnerHidden],
  });

  let content: ReactNode | null = null;
  if (children) {
    content = (
      <>
        <span className={tabInnerTw}>{children}</span>
        <span className={tabInnerHiddenTw}>{children}</span>
      </>
    );
  }

  return (
    <AK.Tab ref={ref} {...props} className={tabTw}>
      {content}
    </AK.Tab>
  );
}
