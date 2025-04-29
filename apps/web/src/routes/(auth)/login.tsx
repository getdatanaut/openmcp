import { Form, FormButton, FormField, FormInput, useFormStore } from '@libs/ui-primitives';
import { createFileRoute, retainSearchParams } from '@tanstack/react-router';
import { useAtomInstance } from '@zedux/react';
import { useState } from 'react';
import { z } from 'zod';

import { authAtom } from '~/atoms/auth.ts';
import { redirectIfLoggedIn } from '~/libs/routing.ts';

import { Canvas } from './-components/Canvas.tsx';

export const Route = createFileRoute('/(auth)/login')({
  component: RouteComponent,
  validateSearch: z.object({
    provider: z.enum(['email']).optional(),
    r: z.string().optional(),
  }),
  search: {
    middlewares: [retainSearchParams(['r'])],
  },
  beforeLoad: redirectIfLoggedIn,
});

function RouteComponent() {
  const { provider } = Route.useSearch();

  return <Canvas authForm={<LoginForm />} provider={provider} type="login" />;
}

function LoginForm() {
  const auth = useAtomInstance(authAtom);

  const [error, setError] = useState<string | null>(null);
  const form = useFormStore({ defaultValues: { email: '', password: '' } });
  const $ = form.names;

  form.useSubmit(async state => {
    setError(null);
    await auth.exports.signIn.email(
      {
        email: state.values.email,
        password: state.values.password,
      },
      {
        onSuccess: async () => {
          await auth.exports.getSession();
        },
        onError: ctx => {
          setError(ctx.error.message);
        },
      },
    );
  });

  return (
    <Form store={form} resetOnSubmit={false}>
      {error ? <div className="ak-text-danger">{error}</div> : null}

      <FormField name={$.email} label="Email">
        <FormInput name={$.email} required type="email" placeholder="me@example.com" autoComplete="email" autoFocus />
      </FormField>

      <FormField name={$.password} label="Password">
        <FormInput name={$.password} required type="password" autoComplete="current-password" />
      </FormField>

      <div className="mt-2 flex items-center gap-2">
        <FormButton validProps={{ intent: 'primary' }} type="submit">
          Log In
        </FormButton>
      </div>
    </Form>
  );
}
