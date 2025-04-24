// import type { SelectSlotProps, selectStyle, SelectStyleProps } from '@marbemac/ui-styles';

import { type ContextValue, createContext } from '../../utils/context.ts';
import type { ButtonProps } from '../Button/button.tsx';
import type { SelectSlotProps, selectStyle, SelectStyleProps } from './select.styles.ts';
import type { SelectProps } from './select.tsx';

export const [SelectInternalContext, useSelectInternalContext] = createContext<{
  slots: ReturnType<typeof selectStyle>;
  classNames: SelectSlotProps['classNames'];
  variant?: ButtonProps['variant'];
  size?: SelectStyleProps['size'];
}>({
  name: 'SelectInternalContext',
  strict: true,
});

export const [SelectContext, useSelectContext] = createContext<ContextValue<SelectProps, HTMLButtonElement>>({
  name: 'SelectContext',
  strict: false,
});
