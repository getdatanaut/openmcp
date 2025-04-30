import type { IHttpService } from '@stoplight/types';

// fragment with HTTP Basic security scheme
export const httpBasicSecurityFragment: Pick<IHttpService, 'security' | 'securitySchemes'> = {
  security: [
    [
      {
        id: 'basic-auth',
        key: 'basicAuth',
        type: 'http',
        scheme: 'basic',
      },
    ],
  ],
  securitySchemes: [
    {
      id: 'basic-auth',
      key: 'basicAuth',
      type: 'http',
      scheme: 'basic',
    },
  ],
};
