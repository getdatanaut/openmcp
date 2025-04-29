import type { IHttpService } from '@stoplight/types';

// fragment with HTTP Bearer security scheme with format
export const httpBearerWithFormatSecurityFragment: Pick<IHttpService, 'security' | 'securitySchemes'> = {
  security: [
    [
      {
        id: 'bearer-auth-jwt',
        key: 'bearerAuthJwt',
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    ],
  ],
  securitySchemes: [
    {
      id: 'bearer-auth-jwt',
      key: 'bearerAuthJwt',
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    },
  ],
};
