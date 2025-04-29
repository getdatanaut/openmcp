import type { IHttpService } from '@stoplight/types';

// fragment with multiple security schemes (OR relationship)
export const multipleOrSecurityFragment: Pick<IHttpService, 'security' | 'securitySchemes'> = {
  security: [
    [
      {
        id: 'api-key-header',
        key: 'apiKeyHeader',
        type: 'apiKey',
        name: 'X-API-KEY',
        in: 'header',
      },
    ],
    [
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
      key: 'apiKeyHeader',
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
