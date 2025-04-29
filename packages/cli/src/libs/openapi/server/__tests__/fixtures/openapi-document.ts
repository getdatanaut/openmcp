import type { IHttpService } from '@stoplight/types';

// Simple OpenAPI document with no servers
export const emptyServersDocument: Pick<IHttpService, 'servers'> = {
  servers: undefined,
};

// OpenAPI document with empty servers array
export const emptyServersArrayDocument: Pick<IHttpService, 'servers'> = {
  servers: [],
};

// OpenAPI document with non-templated servers
export const nonTemplatedServersDocument: Pick<IHttpService, 'servers'> = {
  servers: [
    { id: 'prod-api', url: 'https://api.example.com/v1', description: 'Production API' },
    { id: 'dev-api', url: 'https://dev-api.example.com/v1', name: 'Development API' },
    { id: 'invalid-url', url: 'invalid-url', description: 'Invalid URL' },
  ],
};

// OpenAPI document with a templated server with enum values
export const templatedServerWithEnumDocument: Pick<IHttpService, 'servers'> = {
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

// OpenAPI document with a templated server with only default value
export const templatedServerWithDefaultDocument: Pick<IHttpService, 'servers'> = {
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

// OpenAPI document with a mix of templated and non-templated servers
export const mixedServersDocument: Pick<IHttpService, 'servers'> = {
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

// OpenAPI document with a server that has name but no description
export const serverWithNameDocument: Pick<IHttpService, 'servers'> = {
  servers: [{ id: 'name-only-api', url: 'https://api.example.com/v1', name: 'Production API' }],
};

// OpenAPI document with a server that has an invalid URL
export const invalidUrlServerDocument: Pick<IHttpService, 'servers'> = {
  servers: [{ id: 'invalid-url-server', url: 'not a valid url', description: 'Invalid URL' }],
};

// OpenAPI document with a templated server that resolves to an invalid URL
export const invalidTemplatedServerDocument: Pick<IHttpService, 'servers'> = {
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

// OpenAPI document with multiple templated variables
export const multipleVariablesDocument: Pick<IHttpService, 'servers'> = {
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
