import type { IHttpService } from '@stoplight/types';

// fragment with a server that has an invalid URL
export const invalidUrlServerFragment: Pick<IHttpService, 'servers'> = {
  servers: [{ id: 'invalid-url-server', url: 'not a valid url', description: 'Invalid URL' }],
};
