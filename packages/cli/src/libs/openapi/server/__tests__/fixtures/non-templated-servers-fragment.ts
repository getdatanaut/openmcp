import type { IHttpService } from '@stoplight/types';

// fragment with non-templated servers
export const nonTemplatedServersFragment: Pick<IHttpService, 'servers'> = {
  servers: [
    { id: 'prod-api', url: 'https://api.example.com/v1', description: 'Production API' },
    { id: 'dev-api', url: 'https://dev-api.example.com/v1', name: 'Development API' },
    { id: 'invalid-url', url: 'invalid-url', description: 'Invalid URL' },
  ],
};
