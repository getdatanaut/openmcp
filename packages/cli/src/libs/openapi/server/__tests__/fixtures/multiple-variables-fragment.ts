import type { IHttpService } from '@stoplight/types';

// fragment with multiple templated variables
export const multipleVariablesFragment: Pick<IHttpService, 'servers'> = {
  servers: [
    {
      id: 'multi-variable-api',
      url: 'https://{environment}.api.example.com/{version}',
      description: 'Multi-variable API',
      variables: {
        environment: {
          default: 'dev',
          enum: ['dev', 'staging', 'prod'],
        },
        version: {
          default: 'v1',
          enum: ['v1', 'v2'],
        },
      },
    },
  ],
};
