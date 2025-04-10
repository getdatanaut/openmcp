import { MenuOptionGroupContext } from './menu.context.ts';
import { MenuGroup, type MenuGroupProps } from './menu-group.tsx';

interface BaseMenuOptionGroupProps extends MenuGroupProps {
  onChange: (value: string) => void;
  hideOnClick?: boolean;
}

interface MenuRadioGroupProps extends BaseMenuOptionGroupProps {
  value: string;
  values?: never;
}

interface MenuCheckboxGroupProps extends BaseMenuOptionGroupProps {
  value?: never;
  values: string[];
}

export type MenuOptionGroupProps = MenuRadioGroupProps | MenuCheckboxGroupProps;

export function MenuOptionGroup({ ref, value, values, onChange, hideOnClick, ...props }: MenuOptionGroupProps) {
  return (
    <MenuOptionGroupContext.Provider value={{ value, values, onChange, hideOnClick }}>
      <MenuGroup ref={ref} {...props} />
    </MenuOptionGroupContext.Provider>
  );
}
