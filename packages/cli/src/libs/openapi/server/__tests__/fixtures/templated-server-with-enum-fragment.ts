import type { IHttpService } from '@stoplight/types';

// fragment with a templated server with enum values
export const templatedServerWithEnumFragment: Pick<IHttpService, 'servers'> = {
  servers: [
    {
      id: 'versioned-api-enum',
      url: 'https://api.example.com/{version}',
      description: 'API with version',
      variables: {
        version: {
          default: 'v1',
          enum: ['v1', 'v2'],
        },
      },
    },
  ],
};
