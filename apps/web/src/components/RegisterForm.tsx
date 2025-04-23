import { Form, FormButton, FormField, FormInput, useFormStore } from '@libs/ui-primitives';
import { useAtomInstance } from '@zedux/react';

import { authAtom } from '~/atoms/auth.ts';

export function RegisterForm() {
  const auth = useAtomInstance(authAtom);

  const form = useFormStore({ defaultValues: { email: '', password: '' } });
  const $ = form.names;

  form.useSubmit(async state => {
    await auth.exports.signUp.email(
      {
        name: '',
        email: state.values.email,
        password: state.values.password,
      },
      {
        onRequest: ctx => {
          //show loading
        },
        onSuccess: async ctx => {
          await auth.exports.getSession();
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
        <FormInput name={$.email} required type="email" placeholder="me@example.com" autoComplete="email" />
      </FormField>

      <FormField name={$.password} label="Password">
        <FormInput name={$.password} required type="password" autoComplete="current-password" />
      </FormField>

      <div className="flex gap-2">
        <FormButton validProps={{ intent: 'primary' }} type="submit">
          Sign Up
        </FormButton>
      </div>
    </Form>
  );
}
