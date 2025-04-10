import { type ContextValue, createContext } from '../../utils/context.ts';
import type { MenuSlotProps, menuStyle } from './menu.styles.ts';
import type { MenuProps } from './menu.tsx';

export const [MenuContext, useMenuContext] = createContext<ContextValue<MenuProps, HTMLDivElement>>({
  name: 'MenuContext',
  strict: false,
});

export const [MenuInternalContext, useMenuInternalContext] = createContext<{
  slots: ReturnType<typeof menuStyle>;
  classNames: MenuSlotProps['classNames'];
  searchable: boolean;
}>({
  name: 'MenuInternalContext',
  strict: true,
});

export const [MenuSearchContext, useMenuSearchContext] = createContext<{
  value: string;
}>({
  name: 'MenuSearchContext',
  strict: false,
});

export const [MenuOptionGroupContext, useMenuOptionGroupContext] = createContext<{
  hideOnClick?: boolean;
  value?: string;
  values?: string[];
  onChange: (value: string) => void;
}>({
  name: 'MenuOptionGroupContext',
  strict: true,
});

export const [MenuSearchGroupingContext, useMenuSearchGroupingContext] = createContext<{
  groupLabel?: string;
  groupIsMatched?: boolean;
  setList?: React.Dispatch<React.SetStateAction<string[]>>;
}>({
  name: 'MenuSearchGroupingContext',
  strict: false,
});
