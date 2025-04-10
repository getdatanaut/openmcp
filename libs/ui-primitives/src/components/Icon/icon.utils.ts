import type { IconDefinition } from '@fortawesome/fontawesome-common-types';

import type { IconProps } from './icon.tsx';

export function isIconDefinition(prop?: unknown): prop is IconDefinition {
  if (prop && typeof prop === 'object' && Object.prototype.hasOwnProperty.call(prop, 'icon')) return true;
  return false;
}

export function isIconProp(prop?: unknown): prop is IconProps['icon'] {
  if ((prop && typeof prop === 'string') || Array.isArray(prop)) return true;
  if (prop && typeof prop === 'object' && Object.prototype.hasOwnProperty.call(prop, 'iconName')) return true;
  return false;
}
