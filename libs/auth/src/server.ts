import type { TUserId, TUserSessionId } from '@libs/db-ids';
import { betterAuth, type InferSession, type InferUser } from 'better-auth';

import { type AuthOptions, type CreateAuthOptions, createAuthOptions } from './auth-options.ts';
import { exchangeToken } from './oauth2.ts';
import ROUTES from './routes.ts';

export type Auth = ReturnType<typeof createAuth>;

export interface AuthSession extends Omit<InferSession<AuthOptions>, 'id' | 'userId'> {
  id: TUserSessionId;
  userId: TUserId;
}

export interface AuthUser extends Omit<InferUser<AuthOptions>, 'id'> {
  id: TUserId;
}

export const createAuth = (options: CreateAuthOptions) => {
  const sdk = betterAuth(createAuthOptions(options));
  const origHandler = sdk.handler;
  sdk.handler = function (req) {
    const url = new URL(req.url);
    const actualRoute = url.pathname.slice(options.basePath.length);
    if (actualRoute === ROUTES.exchangeToken) {
      return exchangeToken(req, options.db, sdk);
    }

    return origHandler.call(sdk, req);
  };
  return sdk;
};
