import type { DbSdk } from '@libs/db-pg';
import { betterAuth } from 'better-auth';

import { type CreateAuthOptions, createAuthOptions } from './auth-options.ts';
import { exchangeToken } from './oauth2.ts';
import ROUTES from './routes.ts';
import type { GetUserResult } from './types.ts';

export type Auth = ReturnType<typeof createAuth>;

export type { AuthSession, AuthUser, GetUserResult, JwtPayload } from './types.ts';

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

export async function getUser(
  auth: Auth,
  db: DbSdk,
  { headers }: { headers: Request['headers'] },
): Promise<GetUserResult | null> {
  const authenticationHeader = headers.get('Authorization');
  if (!authenticationHeader) {
    return auth.api.getSession({ headers }) as Promise<GetUserResult | null>;
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
