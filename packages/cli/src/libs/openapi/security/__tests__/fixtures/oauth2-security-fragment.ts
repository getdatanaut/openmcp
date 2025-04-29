import type { IHttpService } from '@stoplight/types';

// fragment with OAuth2 security scheme
export const oauth2SecurityFragment: Pick<IHttpService, 'security' | 'securitySchemes'> = {
  security: [
    [
      {
        id: 'oauth2-auth',
        key: 'petstoreAuth',
        type: 'oauth2',
        flows: {
          implicit: {
            authorizationUrl: 'https://example.com/oauth/authorize',
            scopes: {
              'read:api': 'Read access to the API',
              'write:api': 'Write access to the API',
            },
          },
        },
      },
    ],
  ],
  securitySchemes: [
    {
      id: 'oauth2-auth',
      key: 'petstoreAuth',
      type: 'oauth2',
      flows: {
        implicit: {
          authorizationUrl: 'https://example.com/oauth/authorize',
          scopes: {
            'read:api': 'Read access to the API',
            'write:api': 'Write access to the API',
          },
        },
      },
    },
  ],
};
