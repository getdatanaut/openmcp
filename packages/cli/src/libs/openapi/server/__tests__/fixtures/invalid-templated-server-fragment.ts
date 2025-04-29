import type { IHttpService } from '@stoplight/types';

// fragment with a templated server that resolves to an invalid URL
export const invalidTemplatedServerFragment: Pick<IHttpService, 'servers'> = {
  servers: [
    {
      id: 'invalid-templated-path',
      url: 'https://api.example.com/{path}',
      description: 'API with invalid path',
      variables: {
        path: {
          default: 'not a valid path with spaces',
        },
      },
    },
  ],
};
