import type { TOrganizationId, TUserId, TUserSessionId } from '@libs/db-ids';
import type { DbSdk } from '@libs/db-pg';
import { betterAuth, type InferSession, type InferUser } from 'better-auth';

import { type AuthOptions, type CreateAuthOptions, createAuthOptions } from './auth-options.ts';
import { exchangeToken } from './oauth2.ts';
import ROUTES from './routes.ts';

export type Auth = ReturnType<typeof createAuth>;

export interface AuthSession extends Omit<InferSession<AuthOptions>, 'id' | 'userId' | 'activeOrganizationId'> {
  id: TUserSessionId;
  activeOrganizationId: TOrganizationId | null;
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

type UserResult = {
  user: AuthUser;
  session: AuthSession | null;
};

export async function getUser(
  auth: Auth,
  db: DbSdk,
  { headers }: { headers: Request['headers'] },
): Promise<UserResult | null> {
  const authenticationHeader = headers.get('Authorization');
  if (!authenticationHeader) {
    return auth.api.getSession({ headers }) as Promise<UserResult | null>;
  }

  if (!authenticationHeader.startsWith('Bearer ')) {
    return null;
  }

  const value = authenticationHeader.slice(7).trim();
  const token = await db.queries.oauthAccessToken.getByAccessToken(value);
  if (token === null) {
    return null;
  }

  if (token.accessTokenExpiresAt < new Date()) {
    return null;
  }

  return {
    user: await db.queries.users.byId({ id: token.userId }),
    session: null,
  };
}
