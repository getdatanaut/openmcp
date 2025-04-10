import type { IconDefinition, IconLookup, IconName, IconPrefix } from '@fortawesome/fontawesome-common-types';
import { config, findIconDefinition } from '@fortawesome/fontawesome-svg-core';
import { cloneElement, type ReactElement, type Ref, useMemo } from 'react';

import { splitPropsVariants } from '../../utils/split-props-variants.ts';
import { cn, twMerge } from '../../utils/tw.ts';
import { iconStaticClass, iconStyle, type IconStyleProps } from './icon.styles.ts';
import { isIconDefinition } from './icon.utils.ts';
import { FaSvg } from './svg-icon.tsx';

config.autoAddCss = false;

// Not using the one from common-types because it's such a complex union type
// that it can cause issues with the type inference.
type SimpleIconName = string;

export type { IconName };

export interface IconProps extends IconStyleProps {
  /**
   * The icon to display - can be an imported font-awesome icon definition, font-awsome string name,
   * font-awesome prefix+name tuple, or React element.
   */
  icon: IconDefinition | SimpleIconName | [IconPrefix, SimpleIconName] | IconLookup | ReactElement;

  className?: string;
  /** Fixed width - makes icons occupy the same width */
  fw?: IconStyleProps['fw'];
  ref?: Ref<HTMLElement>;
}

export const DEFAULT_STYLE: IconPrefix = 'fas';

const IS_ELEMENT = '__ELEMENT__' as const;

export function Icon({ ref, ...originalProps }: IconProps) {
  const [props, variantProps] = splitPropsVariants(originalProps, iconStyle.variantKeys);

  const { icon, className, ...rest } = props;

  const slots = useMemo(() => iconStyle(variantProps), [variantProps]);

  const baseTw = slots.base({ class: [iconStaticClass('base'), className] });

  const iconProp = useMemo(() => normalizeIconArgs(icon, DEFAULT_STYLE), [icon]);
  const isComponentIcon = iconProp === IS_ELEMENT;

  if (isComponentIcon) {
    const toClone = icon as ReactElement<{ ref: Ref<HTMLElement>; className?: string }>;
    return cloneElement(toClone, { ref, className: twMerge(baseTw, toClone.props.className) });
  }

  const iconDefinition = isIconDefinition(iconProp)
    ? (iconProp as IconDefinition)
    : findIconDefinition(iconProp as any);

  if (iconDefinition) {
    return <FaSvg {...rest} className={baseTw} icon={iconDefinition} ref={ref as any} />;
  }

  return (
    <i
      ref={ref}
      className={cn(baseTw, iconFACX({ ...(iconProp as any), ...variantProps }))}
      role="img"
      aria-hidden
      {...rest}
    />
  );
}

interface IconFACXProps {
  prefix: IconPrefix;
  iconName: IconName;
  fw?: boolean;
  spin?: boolean;
  pulse?: boolean;
  ping?: boolean;
  bounce?: boolean;
}

const iconFACX = (props: IconFACXProps) => {
  return [
    props.prefix,
    `fa-${props.iconName}`,
    props.fw && 'fa-fw',
    props.spin && 'fa-spin',
    props.pulse && 'fa-pulse',
    props.ping && 'fa-ping',
    props.bounce && 'fa-bounce',
  ];
};

// Adapted from https://github.com/FortAwesome/react-fontawesome/blob/master/src/utils/normalize-icon-args.js
// Adds defaultPrefix and adjusts to fix some typings issues
function normalizeIconArgs(
  icon: IconProps['icon'],
  defaultPrefix: IconPrefix = 'fas',
): IconLookup | IconDefinition | null | typeof IS_ELEMENT {
  // if the icon is null, there's nothing to do
  if (icon === null) {
    return null;
  }

  if (Array.isArray(icon)) {
    // use the first item as prefix, second as icon name
    return { prefix: icon[0], iconName: icon[1] as IconName };
  }

  // if the icon is an object and has a prefix and an icon name, return it
  // @ts-expect-error ignore
  if (typeof icon === 'object' && icon.iconName) {
    // @ts-expect-error ignore
    return icon;
  }

  // if it's a string, use it as the icon name
  if (typeof icon === 'string') {
    return { prefix: defaultPrefix, iconName: icon as IconName };
  }

  return IS_ELEMENT;
}
