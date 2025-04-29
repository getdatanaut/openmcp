import type { IHttpService } from '@stoplight/types';

// fragment with a server that has name but no description
export const serverWithNameFragment: Pick<IHttpService, 'servers'> = {
  servers: [{ id: 'name-only-api', url: 'https://api.example.com/v1', name: 'Production API' }],
};
