import * as AK from '@ariakit/react';
import { faCheck, faCircle } from '@fortawesome/free-solid-svg-icons';
import { type ChangeEvent, useLayoutEffect } from 'react';

import { tn } from '../../utils/tw.ts';
import type { HTMLProps } from '../../utils/types.ts';
import { Icon, type IconProps } from '../Icon/icon.tsx';
import { useMenuInternalContext, useMenuSearchContext, useMenuSearchGroupingContext } from './internal-context.tsx';
import { menuStaticClass } from './menu.styles.ts';

export interface MenuItemProps
  extends Omit<AK.ComboboxItemOptions, 'store' | 'defaultChecked' | 'defaultValue' | 'value'>,
    Pick<HTMLProps<'div'>, 'className' | 'children' | 'role' | 'aria-checked' | 'onClick'> {
  checked?: boolean;
  icon?: IconProps['icon'];
  endIcon?: IconProps['icon'];
  shortcut?: string;
  ref?: React.Ref<HTMLDivElement>;
}

export function MenuItem(props: MenuItemProps) {
  return <BaseMenuItem {...props} optionType={typeof props.checked === 'boolean' ? 'checkbox' : undefined} />;
}

/**
 * Internal
 */

interface BaseMenuItemProps extends MenuItemProps {
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  optionType?: 'radio' | 'checkbox';
}

export function BaseMenuItem(props: BaseMenuItemProps) {
  const { value: searchValue } = useMenuSearchContext() || {};
  const { groupIsMatched } = useMenuSearchGroupingContext() || {};

  if (!groupIsMatched && searchValue) {
    const valueToSearch = typeof props.children === 'string' ? props.children : '';
    const match = valueToSearch.toLowerCase().includes(searchValue.toLowerCase());
    if (!match) return null;
  }

  return <BaseMenuItemContent {...props} />;
}

function BaseMenuItemContent({
  className,
  value,
  optionType,
  checked,
  hideOnClick,
  icon,
  endIcon,
  shortcut,
  ref,
  ...props
}: BaseMenuItemProps) {
  const menu = AK.useMenuContext();
  if (!menu) throw new Error('MenuItem must be used inside a Menu');

  const { slots, classNames, searchable } = useMenuInternalContext();

  // Add item to list when it mounts, remove it when it unmounts.
  const { setList } = useMenuSearchGroupingContext() || {};
  const itemId = value || typeof props.children === 'string' ? String(props.children) : '';
  useLayoutEffect(() => {
    if (!searchable || !setList || !itemId) return;

    setList(list => [...list, itemId]);

    return () => {
      setList(list => list.filter(v => v !== itemId));
    };
  }, [setList, itemId, searchable]);

  const baseTw = slots.item({ class: [menuStaticClass('item'), className, classNames?.item] });
  // const contentTw = slots.itemContent({ class: [menuStaticClass('itemContent'), classNames?.itemContent] });
  const indicatorTw = slots.itemIndicator({
    class: [menuStaticClass('itemIndicator'), classNames?.itemIndicator, optionType === 'radio' && 'text-[0.4em]'],
  });
  const iconTw = slots.itemStartIcon({
    class: [menuStaticClass('itemStartIcon'), classNames?.itemStartIcon],
  });
  const endIconTw = slots.itemEndIcon({
    class: [menuStaticClass('itemEndIcon'), classNames?.itemEndIcon],
  });
  const shortcutTw = slots.itemShortcut({
    class: [menuStaticClass('itemShortcut'), classNames?.itemShortcut],
  });

  let defaultProps: MenuItemProps = {
    ref,
    focusOnHover: true,
    blurOnHoverEnd: false,
    ...props,
    className: baseTw,
  };

  const checkable = !!optionType;

  defaultProps.children = (
    <>
      {checkable ? (
        <div className={indicatorTw}>
          <Icon
            icon={optionType === 'checkbox' ? faCheck : faCircle}
            className={tn(['mx-auto', !checked && 'invisible'])}
            fw
          />
        </div>
      ) : null}

      {icon && (
        <div className={iconTw}>
          <Icon icon={icon} fw />
        </div>
      )}

      {defaultProps.children}

      {shortcut && <div className={shortcutTw}>{shortcut}</div>}

      {endIcon && (
        <div className={endIconTw}>
          <Icon icon={endIcon} />
        </div>
      )}

      {checkable && searchable && (
        // When an item is displayed in a search menu as a role=option
        // element instead of a role=menuitemradio, we can't depend on the
        // aria-checked attribute. Although NVDA and JAWS announce it
        // accurately, VoiceOver doesn't. TalkBack does announce the checked
        // state, but misleadingly implies that a double tap will change the
        // state, which isn't the case. Therefore, we use a visually hidden
        // element to indicate whether the item is checked or not, ensuring
        // cross-browser/AT compatibility.
        <AK.VisuallyHidden>{checked ? 'checked' : 'not checked'}</AK.VisuallyHidden>
      )}
    </>
  );

  const shouldHideOnClick = optionType ? (hideOnClick ?? false) : true;
  if (optionType) {
    defaultProps = {
      ...defaultProps,
      hideOnClick: shouldHideOnClick,
      checked,
      role: optionType === 'checkbox' ? 'menuitemcheckbox' : 'menuitemradio',
      'aria-checked': checked,
    };
  }

  // If the item is not rendered in a search menu (listbox), we can render it as a MenuItem
  if (!searchable) {
    return <AK.MenuItem {...defaultProps} />;
  }

  return (
    <AK.ComboboxItem
      {...defaultProps}
      setValueOnClick={false}
      value={checkable ? value : undefined}
      selectValueOnClick={() => {
        // @TODO this doesn't seem quite right, but things seem to work atm...
        if (itemId == null || value == null) return false;
        // By default, clicking on a ComboboxItem will update the
        // selectedValue state of the combobox. However, since we're sharing
        // state between combobox and menu, we also need to update the menu's
        // values state.
        menu.setValue(itemId, value);
        return true;
      }}
      hideOnClick={event => {
        // Make sure that clicking on a combobox item that opens a nested
        // menu/dialog does not close the menu.
        const expandable = event.currentTarget.hasAttribute('aria-expanded');
        if (expandable) return false;

        if (!shouldHideOnClick) return false;

        // By default, clicking on a ComboboxItem only closes its own popover.
        // However, since we're in a menu context, we also close all parent
        // menus.
        menu.hideAll();

        return true;
      }}
    />
  );
}
