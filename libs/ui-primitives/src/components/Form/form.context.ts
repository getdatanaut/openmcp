import { type ContextValue, createContext } from '../../utils/context.ts';
import type { FormSlotProps, formStyle } from './form.styles.ts';
import type { FormProps } from './form.tsx';

export const [FormInternalContext, useFormInternalContext] = createContext<{
  disabled?: boolean;
  readOnly?: boolean;
  slots: ReturnType<typeof formStyle>;
  classNames: FormSlotProps['classNames'];
}>({
  name: 'FormInternalContext',
  strict: true,
});

export const [FormContext, useFormContext] = createContext<ContextValue<FormProps, HTMLFormElement>>({
  name: 'FormContext',
  strict: false,
});

export type { FormStore } from '@ariakit/react';
export { useFormStore } from '@ariakit/react';
