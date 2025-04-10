import * as AK from '@ariakit/react';
import { useMemo } from 'react';

import { splitPropsVariants } from '../../utils/split-props-variants.ts';
import { TabsInternalContext } from './internal-context.tsx';
import { type TabsSlotProps, tabsStyle, type TabsStyleProps } from './tabs.styles.ts';

export interface TabsProps extends Omit<AK.TabProviderProps, 'store' | 'className'>, TabsStyleProps, TabsSlotProps {}

export function Tabs(originalProps: TabsProps) {
  const [{ classNames, children, ...props }, variantProps] = splitPropsVariants(originalProps, tabsStyle.variantKeys);

  const slots = useMemo(() => tabsStyle(variantProps), [variantProps]);

  return (
    <TabsInternalContext.Provider value={{ slots, classNames }}>
      <AK.TabProvider {...props}>{children}</AK.TabProvider>
    </TabsInternalContext.Provider>
  );
}
