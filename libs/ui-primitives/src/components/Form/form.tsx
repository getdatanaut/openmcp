import * as AK from '@ariakit/react';
import { useFormReset } from '@ariakit/react-core/form/form-reset';
import { type ComponentProps, type ReactNode, useMemo } from 'react';

import { useContextProps } from '../../utils/context.ts';
import { Provider } from '../../utils/provider.tsx';
import { splitPropsVariants } from '../../utils/split-props-variants.ts';
import { ButtonContext } from '../Button/button.context.ts';
import { Button, type ButtonProps } from '../Button/button.tsx';
import { InputContext } from '../Input/input.context.ts';
import { Input, type InputOptions } from '../Input/input.tsx';
import { LabelContext } from '../Label/label.context.ts';
import { Label } from '../Label/label.tsx';
// import { Select, SelectContext, type SelectProps } from '../Select/select.tsx';
import { FormContext, FormInternalContext, useFormInternalContext } from './form.context.ts';
import { type FormSlotProps, formStaticClass, formStyle, type FormStyleProps } from './form.styles.ts';

type AKProps = AK.FormOptions & Pick<ComponentProps<'form'>, 'onSubmit' | 'ref' | 'className' | 'children'>;

export interface FormProps extends AKProps, FormStyleProps, FormSlotProps {
  /** Disables the entire form and all child elements, including buttons. */
  disabled?: boolean;

  /** Marks the entire form and all child elements as read-only, including buttons. */
  readOnly?: boolean;
}

export function Form({ ref, ...originalProps }: FormProps) {
  [originalProps, ref] = useContextProps(originalProps, FormContext, ref, {
    // Defaults
    validateOnChange: false,
  });

  const [{ className, classNames, disabled, readOnly, store, ...props }, variantProps] = splitPropsVariants(
    originalProps,
    formStyle.variantKeys,
  );

  const slots = useMemo(
    () => formStyle({ ...variantProps }),

    // eslint-disable-next-line react-hooks/exhaustive-deps
    Object.values(variantProps),
  );

  const baseTw = slots.base({ class: [formStaticClass('base'), className] });

  return (
    <Provider
      values={[
        [FormInternalContext, { disabled, readOnly, slots, classNames }],
        [LabelContext, { disabled: disabled, size: variantProps.size }],
        [InputContext, { disabled, readOnly, size: variantProps.size }],
        [ButtonContext, { disabled: disabled || readOnly, size: variantProps.size }],
        // [SelectContext, { disabled: disabled || readOnly, size: variantProps.size }],
      ]}
    >
      <AK.Form ref={ref} className={baseTw} store={store} {...props} />
    </Provider>
  );
}

export interface FormFieldProps extends Pick<ComponentProps<'div'>, 'className' | 'children' | 'ref'> {
  label: ReactNode;
  name: AK.FormControlProps['name'];
  hint?: ReactNode;
}

export function FormField({ ref, className, name, label, children, hint, ...props }: FormFieldProps) {
  const { slots, classNames } = useFormInternalContext();

  const fieldTw = slots.field({ class: [formStaticClass('field'), className, classNames?.field] });
  const fieldHeaderTw = slots.fieldHeader({ class: [formStaticClass('fieldHeader'), classNames?.fieldHeader] });
  const fieldLabelTw = slots.fieldLabel({ class: [formStaticClass('fieldLabel'), classNames?.fieldLabel] });
  const fieldErrorTw = slots.fieldError({ class: [formStaticClass('fieldError'), classNames?.fieldError] });
  const fieldHintTw = slots.fieldHint({ class: [formStaticClass('fieldHint'), classNames?.fieldHint] });

  return (
    <div ref={ref} {...props} className={fieldTw}>
      <div className={fieldHeaderTw}>
        <AK.FormLabel name={name} render={<Label className={fieldLabelTw} />}>
          {label}
        </AK.FormLabel>

        <AK.FormError name={name} className={fieldErrorTw} />
      </div>

      {children}

      {hint ? <div className={fieldHintTw}>{hint}</div> : null}
    </div>
  );
}

export interface FormInputProps extends Omit<AK.FormInputProps, 'size'>, Omit<InputOptions, keyof AK.FormInputProps> {}

export function FormInput({ required, ...props }: FormInputProps) {
  const form = AK.useFormContext();
  if (!form) throw new Error('FormInput must be used within a Form');

  // Not using the built-in browser validation, so that we can customize the error message
  form.useValidate(() => {
    if (required && !form.getValue(props.name)) {
      form.setError(props.name, 'Required');
    }
  });

  return <AK.FormInput render={<Input />} aria-required={required} {...props} />;
}

// export interface FormSelectProps
//   extends AK.FormControlProps<'button'>,
//     Omit<SelectProps, keyof AK.FormControlProps<'button'>> {}

// export const FormSelect = forwardRef<HTMLButtonElement, FormSelectProps>(function FormSelect({ name, ...props }, ref) {
//   const form = AK.useFormContext();
//   if (!form) throw new Error('FormSelect must be used within a Form');

//   const value = form.useValue(name);

//   const select = (
//     <Select ref={ref} value={value} onChange={value => form.setValue(name, value)} render={props.render} />
//   );

//   const field = <AK.FormControl name={name} render={select} />;

//   return <AK.Role.button {...props} render={field} />;
// });

export interface FormButtonProps extends ButtonProps {
  /**
   * Props that are spread over the button when the form is valid.
   */
  validProps?: ButtonProps;

  /**
   * Props that are spread over the button when the form is submitting.
   */
  submittingProps?: ButtonProps;
}

/**
 * Supports passing props to the button when the form is valid or submitting.
 *
 * By default, will disable the button when the form is submitting.
 *
 * By default, will set accessibleWhenDisabled=true if the button type is "submit".
 */
export function FormButton({ validProps, submittingProps, ...props }: FormButtonProps) {
  const form = AK.useFormContext();
  if (!form) throw new Error('FormSubmitButton must be used within a Form');

  // @TODO not working as expected atm, follow https://github.com/ariakit/ariakit/issues/4439
  const isValid = AK.useStoreState(form, 'valid');
  const isSubmitting = AK.useStoreState(form, 'submitting');

  return (
    <Button
      accessibleWhenDisabled={props.type === 'submit'}
      {...props}
      disabled={isSubmitting}
      {...(isValid ? validProps : null)}
      {...(isSubmitting ? submittingProps : null)}
    />
  );
}

export interface FormResetProps extends FormButtonProps {}

/**
 * Supports passing props to the button when the form is valid or submitting.
 *
 * By default, will disable the button when the form is submitting.
 *
 * By default, will set accessibleWhenDisabled=true if the button type is "submit".
 */
export function FormReset(props: FormResetProps) {
  const form = AK.useFormContext();
  if (!form) throw new Error('FormReset must be used within a Form');

  const reset = useFormReset();

  return <Button {...props} type="reset" onClick={reset.onClick} />;
}
