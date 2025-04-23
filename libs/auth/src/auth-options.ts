import {
  AuthVerificationId,
  InviteId,
  MemberId,
  OrganizationId,
  type TUserId,
  UserAccountId,
  UserId,
  UserSessionId,
} from '@libs/db-ids';
import type { DbSdk } from '@libs/db-pg';
import { type BetterAuthOptions, generateId } from 'better-auth';
import { jwt } from 'better-auth/plugins/jwt';
import { oidcProvider } from 'better-auth/plugins/oidc-provider';
import { organization } from 'better-auth/plugins/organization';
import type { SocialProviders } from 'better-auth/social-providers';

import type { JwtPayload } from './types.ts';

export interface CreateAuthOptions extends Pick<BetterAuthOptions, 'baseURL'> {
  db: DbSdk;
  basePath: string;
  socialProviders?: SocialProviders;
  loginPage?: string;
  jwtOpts?: {
    expirationTime: number | string | Date;
  };
  generateOrgData(user: { id: TUserId; name: string; email: string }): Promise<{
    name: string;
    slug: string;
    logo?: string;
    metadata?: string;
  }>;
}

export type AuthOptions = ReturnType<typeof createAuthOptions>;

export const createAuthOptions = ({
  db,
  socialProviders,
  basePath,
  baseURL,
  loginPage = '/',
  jwtOpts,
  generateOrgData,
}: CreateAuthOptions) => {
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
      jwt({
        jwt: {
          definePayload(_session) {
            return {} satisfies JwtPayload;
          },
          ...jwtOpts,
        },
      }),
      organization({
        allowUserToCreateOrganization: false,
        // ac: accessControl,
        // organizationCreation:
        schema: {
          organization: {
            modelName: 'organizations',
          },
          member: {
            modelName: 'members',
          },
          invitation: {
            modelName: 'invitations',
          },
        },
      }),
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
      session: {
        create: {
          before: async session => {
            const activeOrganizationId = await db.queries.users.getActiveOrganizationId({
              userId: session.userId as TUserId,
            });
            return {
              data: {
                ...session,
                activeOrganizationId,
              },
            };
          },
        },
      },
      user: {
        create: {
          after: async user => {
            const userId = user.id as TUserId;
            const [, org] = await Promise.all([
              // openmcp-cli is our own app and thus a trusted client
              await db.queries.oauthConsent.giveConsent({
                userId,
                clientId: 'openmcp-cli',
                scopes: ['openid', 'profile', 'email', 'offline_access'],
              }),
              db.queries.organizations.create(
                await generateOrgData({
                  id: userId,
                  name: user.name,
                  email: user.email,
                }),
              ),
            ]);

            await db.queries.members.create({
              role: 'owner',
              userId,
              organizationId: org.id,
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
              return InviteId.generate();
            case 'member':
              return MemberId.generate();
            case 'organization':
              return OrganizationId.generate();
            case 'jwks':
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
