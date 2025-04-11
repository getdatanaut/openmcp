import { Form, FormButton, FormField, FormInput, useFormStore } from '@libs/ui-primitives';

import { signUp } from '~/libs/auth.ts';

export function RegisterForm() {
  const form = useFormStore({ defaultValues: { email: '', password: '' } });
  const $ = form.names;

  form.useSubmit(async state => {
    await signUp.email(
      {
        name: '',
        email: state.values.email,
        password: state.values.password,
      },
      {
        onRequest: ctx => {
          //show loading
        },
        onSuccess: ctx => {
          //redirect to the dashboard or sign in page
        },
        onError: ctx => {
          // display the error message
          alert(ctx.error.message);
        },
      },
    );
  });

  return (
    <Form store={form} className="w-80">
      <FormField name={$.email} label="Email">
        <FormInput name={$.email} required type="email" placeholder="me@example.com" />
      </FormField>

      <FormField name={$.password} label="Password">
        <FormInput name={$.password} required type="password" />
      </FormField>

      <div className="flex gap-2">
        <FormButton validProps={{ intent: 'primary' }} type="submit">
          Sign Up
        </FormButton>
      </div>
    </Form>
  );
}
