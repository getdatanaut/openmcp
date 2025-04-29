import type { QueryClient } from '@tanstack/react-query';
import { type ParsedLocation, redirect } from '@tanstack/react-router';
import { z } from 'zod';

import { authAtom } from '~/atoms/auth.ts';
import type { Ecosystem } from '~/hooks/inject-ecosystem.ts';

export interface RouterContext {
  queryClient: QueryClient;
  ecosystem: Ecosystem;
}

export const fallback = <TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  fallback: TSchema['_input'],
): z.ZodPipeline<z.ZodType<TSchema['_input'], z.ZodTypeDef, TSchema['_input']>, z.ZodCatch<TSchema>> => {
  return z.custom<TSchema['_input']>().pipe(schema.catch(fallback));
};

export const redirectIfLoggedOut = ({ context, location }: { context: RouterContext; location: ParsedLocation }) => {
  const isLoggedIn = context.ecosystem.getNodeOnce(authAtom).exports.isLoggedIn();
  if (!isLoggedIn) {
    throw redirect({ to: '/login', search: { r: location.href }, replace: true });
  }
};

export const redirectIfLoggedIn = ({ context, location }: { context: RouterContext; location: ParsedLocation }) => {
  const isLoggedIn = context.ecosystem.getNodeOnce(authAtom).exports.isLoggedIn();
  if (isLoggedIn) {
    throw redirect({ to: '/', search: { r: location.href }, replace: true });
  }
};
