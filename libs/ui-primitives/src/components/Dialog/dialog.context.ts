import { type ContextValue, createContext } from '../../utils/context.ts';
import type { DialogSlotProps, dialogStyle } from './dialog.styles.ts';
import type { DialogProps } from './dialog.tsx';

export const [DialogInternalContext, useDialogInternalContext] = createContext<{
  slots: ReturnType<typeof dialogStyle>;
  classNames: DialogSlotProps['classNames'];
}>({
  name: 'DialogInternalContext',
  strict: true,
});

export const [DialogContext, useDialogContext] = createContext<ContextValue<DialogProps, HTMLDivElement>>({
  name: 'DialogContext',
  strict: false,
});
