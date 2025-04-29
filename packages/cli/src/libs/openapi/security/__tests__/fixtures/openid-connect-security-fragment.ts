import type { IHttpService } from '@stoplight/types';

// fragment with OpenID Connect security scheme
export const openIdConnectSecurityFragment: Pick<IHttpService, 'security' | 'securitySchemes'> = {
  security: [
    [
      {
        id: 'openid-auth',
        key: 'openId',
        type: 'openIdConnect',
        openIdConnectUrl: 'https://example.com/.well-known/openid-configuration',
      },
    ],
  ],
  securitySchemes: [
    {
      id: 'openid-auth',
      key: 'openId',
      type: 'openIdConnect',
      openIdConnectUrl: 'https://example.com/.well-known/openid-configuration',
    },
  ],
};
