import type { IHttpService } from '@stoplight/types';

// fragment with HTTP Bearer security scheme
export const httpBearerSecurityFragment: Pick<IHttpService, 'security' | 'securitySchemes'> = {
  security: [
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
      id: 'bearer-auth',
      key: 'bearerAuth',
      type: 'http',
      scheme: 'bearer',
    },
  ],
};
