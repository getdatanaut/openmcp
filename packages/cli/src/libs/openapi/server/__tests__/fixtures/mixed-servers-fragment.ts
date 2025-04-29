import type { IHttpService } from '@stoplight/types';

// fragment with a mix of templated and non-templated servers
export const mixedServersFragment: Pick<IHttpService, 'servers'> = {
  servers: [
    { id: 'static-api', url: 'https://static-api.example.com', description: 'Static API' },
    {
      id: 'mixed-versioned-api',
      url: 'https://api.example.com/{version}',
      name: 'Versioned API',
      variables: {
        version: {
          default: 'v1',
        },
      },
    },
  ],
};
