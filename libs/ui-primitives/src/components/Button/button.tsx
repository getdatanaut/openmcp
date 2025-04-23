import * as AK from '@ariakit/react';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { memo, type ReactNode, type Ref, useMemo } from 'react';

import { useContextProps } from '../../utils/context.ts';
import { splitPropsVariants } from '../../utils/split-props-variants.ts';
import { tn } from '../../utils/tw.ts';
import { Icon, type IconProps } from '../Icon/icon.tsx';
import { ButtonContext } from './button.context.ts';
import { type ButtonSlotProps, buttonStaticClass, buttonStyle, type ButtonStyleProps } from './button.styles.ts';

type AKProps = AK.ButtonOptions & Pick<AK.ButtonProps, 'onClick' | 'title' | 'type' | 'tabIndex'>;

export interface ButtonProps extends AKProps, ButtonStyleProps, ButtonSlotProps {
  children?: ReactNode;
  className?: string;
  ref?: Ref<HTMLButtonElement>;

  /** If added, the button will show an icon before the button's label. */
  icon?: IconProps['icon'];

  /** If added, the button will show an icon after the button's label. */
  endIcon?: IconProps['icon'];

  /** The icon to show when `isLoading` is true. */
  loadingIcon?: IconProps['icon'];

  /** The label to show in the button when `isLoading` is true. */
  loadingText?: string;

  /** If provided, the button will show a centered icon instead of the normal button content. */
  overlayIcon?: IconProps['icon'];
}

const DEFAULT_SPINNER: IconProps['icon'] = faSpinner;

export const Button = memo(function Button({ ref, ...originalProps }: ButtonProps) {
  [originalProps, ref] = useContextProps(originalProps, ButtonContext, ref);

  const [
    { className, classNames, children, icon, endIcon, loadingIcon, loadingText, overlayIcon, ...props },
    variantProps,
  ] = splitPropsVariants(originalProps, buttonStyle.variantKeys);

  const overlayIconTw = tn(
    '[display:inherit]',
    (!loadingText || overlayIcon) && 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
  );

  const overlayIconElem =
    overlayIcon || variantProps.isLoading ? (
      <Icon
        fw
        className={overlayIconTw}
        icon={overlayIcon ?? loadingIcon ?? DEFAULT_SPINNER}
        spin={variantProps.isLoading}
      />
    ) : null;

  // When loading:
  // - if we don't have a loadingText, we make the content invisible, to preserve the button's width
  // - if we have a loadingText, we we hide the icon and endIcon
  const hiddenContentClass = tn(overlayIconElem ? (!loadingText ? 'invisible' : 'hidden') : '');
  const slots = useMemo(() => buttonStyle(variantProps), [variantProps]);

  const baseTw = slots.base({ class: [buttonStaticClass('base'), className] });
  const iconTw = slots.icon({
    class: [buttonStaticClass('icon'), hiddenContentClass, classNames?.icon],
  });
  const endIconTw = slots.endIcon({ class: [buttonStaticClass('endIcon'), hiddenContentClass, classNames?.endIcon] });
  const textTw = slots.text({
    class: [buttonStaticClass('text'), !loadingText && hiddenContentClass, classNames?.text],
  });

  const contentElem = !overlayIconElem ? children : loadingText || children;
  const hasContent = contentElem !== undefined && contentElem !== null;
  const isIconButton = !hasContent;

  return (
    <AK.Button {...props} ref={ref} className={baseTw} disabled={variantProps.disabled}>
      {icon && (!isIconButton || !endIcon) ? <Icon className={iconTw} icon={icon} /> : null}

      {overlayIconElem}

      {hasContent ? <div className={textTw}>{contentElem}</div> : null}

      {endIcon ? <Icon className={endIconTw} icon={endIcon} /> : null}
    </AK.Button>
  );
});
