import { createContext } from '../../utils/context.tsx';
import type { FormSlotProps, formStyle } from './form.styles.ts';

export const [FormInternalContext, useFormInternalContext] = createContext<{
  disabled?: boolean;
  readOnly?: boolean;
  slots: ReturnType<typeof formStyle>;
  classNames: FormSlotProps['classNames'];
}>({
  name: 'FormInternalContext',
  strict: true,
});
