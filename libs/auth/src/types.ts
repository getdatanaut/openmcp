import type { TUserId, TUserSessionId } from '@libs/db-ids';
import type { InferSession, InferUser } from 'better-auth';

import type { AuthOptions } from './auth-options.ts';

export interface AuthSession extends Omit<InferSession<AuthOptions>, 'id' | 'userId'> {
  id: TUserSessionId;
  userId: TUserId;
}

export interface AuthUser extends Omit<InferUser<AuthOptions>, 'id'> {
  id: TUserId;
}

export interface JwtPayload {}
