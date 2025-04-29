import type { IHttpService } from '@stoplight/types';

// fragment with HTTP security scheme with unsupported scheme
export const httpUnsupportedSchemeFragment: Pick<IHttpService, 'security' | 'securitySchemes'> = {
  security: [
    [
      {
        id: 'digest-auth',
        key: 'digestAuth',
        type: 'http',
        scheme: 'digest',
      },
    ],
  ],
  securitySchemes: [
    {
      id: 'digest-auth',
      key: 'digestAuth',
      type: 'http',
      scheme: 'digest',
    },
  ],
};
