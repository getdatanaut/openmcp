import { createContext } from '../../utils/context.ts';
import type { TabsSlotProps, tabsStyle } from './tabs.styles.ts';

export const [TabsInternalContext, useTabsInternalContext] = createContext<{
  slots: ReturnType<typeof tabsStyle>;
  classNames: TabsSlotProps['classNames'];
}>({
  name: 'TabsInternalContext',
  strict: true,
});
