import type { TUserId, TUserSessionId } from '@libs/db-ids';
import { betterAuth, type InferSession, type InferUser } from 'better-auth';

import { type AuthOptions, type CreateAuthOptions, createAuthOptions } from './auth-options.ts';

export type Auth = ReturnType<typeof createAuth>;

export interface AuthSession extends Omit<InferSession<AuthOptions>, 'id' | 'userId'> {
  id: TUserSessionId;
  userId: TUserId;
}

export interface AuthUser extends Omit<InferUser<AuthOptions>, 'id'> {
  id: TUserId;
}

export const createAuth = (options: CreateAuthOptions) => {
  return betterAuth(createAuthOptions(options));
};
