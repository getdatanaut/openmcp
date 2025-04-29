import type { IHttpService } from '@stoplight/types';

// fragment with a templated server with only default value
export const templatedServerWithDefaultFragment: Pick<IHttpService, 'servers'> = {
  servers: [
    {
      id: 'versioned-api-default',
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
