import type { ClientOptions } from 'better-auth';
import { jwtClient, oidcClient } from 'better-auth/client/plugins';
import { createAuthClient as baseCreateAuthClient } from 'better-auth/react';

export type { AuthSession, AuthUser, JwtPayload } from './types.ts';

export const createAuthClient = (options: Omit<ClientOptions, 'plugins'>) => {
  return baseCreateAuthClient({
    ...options,
    plugins: [jwtClient(), oidcClient()],
  });
};
