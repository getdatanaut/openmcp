import { AuthVerificationId, type TUserId, UserAccountId, UserId, UserSessionId } from '@libs/db-ids';
import type { DbSdk } from '@libs/db-pg';
import { type BetterAuthOptions, generateId } from 'better-auth';
import { oidcProvider } from 'better-auth/plugins/oidc-provider';
import type { SocialProviders } from 'better-auth/social-providers';

export interface CreateAuthOptions extends Pick<BetterAuthOptions, 'baseURL'> {
  db: DbSdk;
  basePath: string;
  socialProviders?: SocialProviders;
  loginPage?: string;
}

export type AuthOptions = ReturnType<typeof createAuthOptions>;

export const createAuthOptions = ({ db, socialProviders, basePath, baseURL, loginPage = '/' }: CreateAuthOptions) => {
  return {
    appName: 'Datanaut',
    baseURL,
    basePath,
    emailAndPassword: {
      enabled: true,
    },
    socialProviders: {
      ...socialProviders,
    },
    plugins: [
      oidcProvider({
        // the default for access token is 1 hour,
        // while the default for refresh token is 7 days
        loginPage,
        scopes: ['openid', 'profile', 'email', 'offline_access'],
        requirePKCE: true,
      }),
    ],
    database: {
      db: db.client,
      type: 'postgres',
      casing: 'snake',
    },
    user: {
      modelName: 'users',
    },
    session: {
      modelName: 'userSessions',
    },
    account: {
      modelName: 'userAccounts',
    },
    verification: {
      modelName: 'authVerifications',
    },
    databaseHooks: {
      user: {
        create: {
          after: async user => {
            // openmcp-cli is our own app and thus a trusted client
            await db.queries.oauthConsent.giveConsent({
              userId: user.id as TUserId,
              clientId: 'openmcp-cli',
              scopes: ['openid', 'profile', 'email', 'offline_access'],
            });
          },
        },
      },
    },
    advanced: {
      database: {
        generateId({ model, size }) {
          switch (model) {
            case 'account':
              return UserAccountId.generate();
            case 'session':
              return UserSessionId.generate();
            case 'user':
              return UserId.generate();
            case 'verification':
              return AuthVerificationId.generate();
            case 'invitation':
            case 'jwks':
            case 'member':
            case 'organization':
            case 'passkey':
            case 'rate-limit':
            case 'two-factor':
            default:
              return generateId(size);
          }
        },
      },
    },
  } as const satisfies BetterAuthOptions;
};
