import type { IHttpService } from '@stoplight/types';

// fragment with API Key security schemes
export const apiKeySecurityFragment: Pick<IHttpService, 'security' | 'securitySchemes'> = {
  security: [
    [
      {
        id: 'api-key-header',
        key: 'apiKey',
        type: 'apiKey',
        name: 'X-API-KEY',
        in: 'header',
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
  ],
};
