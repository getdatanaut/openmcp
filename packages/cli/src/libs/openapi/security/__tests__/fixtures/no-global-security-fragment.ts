import type { IHttpService } from '@stoplight/types';

// fragment with security schemes but no global security
export const noGlobalSecurityFragment: Pick<IHttpService, 'security' | 'securitySchemes'> = {
  security: undefined,
  securitySchemes: [
    {
      id: 'api-key-header',
      key: 'apiKeyHeader',
      type: 'apiKey',
      name: 'X-API-KEY',
      in: 'header',
    },
    {
      id: 'api-key-query',
      key: 'apiKeyQuery',
      type: 'apiKey',
      name: 'api_key',
      in: 'query',
    },
    {
      id: 'api-key-cookie',
      key: 'apiKeyCookie',
      type: 'apiKey',
      name: 'api_key',
      in: 'cookie',
    },
  ],
};
