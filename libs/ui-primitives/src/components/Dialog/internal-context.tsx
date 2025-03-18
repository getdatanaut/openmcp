import { createContext } from '../../utils/context.tsx';
import type { DialogSlotProps, dialogStyle } from './dialog.styles.ts';

export const [DialogInternalContext, useDialogInternalContext] = createContext<{
  slots: ReturnType<typeof dialogStyle>;
  classNames: DialogSlotProps['classNames'];
}>({
  name: 'DialogInternalContext',
  strict: true,
});
