import { betterAuth } from 'better-auth';

import { type CreateAuthOptions, createAuthOptions } from './auth-options.ts';

export const createAuth = (options: CreateAuthOptions) => {
  return betterAuth(createAuthOptions(options));
};
