import { createContext } from '../../utils/context.tsx';
import type { MenuSlotProps, menuStyle } from './menu.styles.ts';

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
