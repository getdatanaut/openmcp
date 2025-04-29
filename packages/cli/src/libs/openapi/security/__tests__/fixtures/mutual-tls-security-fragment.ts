import type { IHttpService } from '@stoplight/types';

// fragment with Mutual TLS security scheme
export const mutualTlsSecurityFragment: Pick<IHttpService, 'security' | 'securitySchemes'> = {
  security: [
    [
      {
        id: 'mtls-auth',
        key: 'mtlsAuth',
        type: 'mutualTLS',
      },
    ],
  ],
  securitySchemes: [
    {
      id: 'mtls-auth',
      key: 'mtlsAuth',
      type: 'mutualTLS',
    },
  ],
};
