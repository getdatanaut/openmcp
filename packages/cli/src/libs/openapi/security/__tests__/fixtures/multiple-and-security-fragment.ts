import type { IHttpService } from '@stoplight/types';

// fragment with multiple security schemes (AND relationship)
export const multipleAndSecurityFragment: Pick<IHttpService, 'security' | 'securitySchemes'> = {
  security: [
    [
      {
        id: 'api-key-header',
        key: 'apiKey',
        type: 'apiKey',
        name: 'X-API-KEY',
        in: 'header',
      },
      {
        id: 'bearer-auth',
        key: 'bearerAuth',
        type: 'http',
        scheme: 'bearer',
      },
    ],
  ],
  securitySchemes: [
    {
      id: 'api-key-header',
      key: 'apiKey',
      type: 'apiKey',
      name: 'X-API-KEY',
      in: 'header',
    },
    {
      id: 'bearer-auth',
      key: 'bearerAuth',
      type: 'http',
      scheme: 'bearer',
    },
  ],
};
