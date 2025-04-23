import type { TOrganizationId, TUserId, TUserSessionId } from '@libs/db-ids';
import type { InferSession, InferUser } from 'better-auth';

import type { AuthOptions } from './auth-options.ts';

export interface AuthSession extends Omit<InferSession<AuthOptions>, 'id' | 'userId' | 'activeOrganizationId'> {
  id: TUserSessionId;
  userId: TUserId;
  activeOrganizationId: TOrganizationId | null;
}

export interface AuthUser extends Omit<InferUser<AuthOptions>, 'id'> {
  id: TUserId;
}

export type GetUserResult = {
  user: AuthUser;
  session: AuthSession | null;
};

export interface JwtPayload {}
