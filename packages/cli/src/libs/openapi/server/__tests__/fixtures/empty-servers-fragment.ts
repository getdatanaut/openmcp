import type { IHttpService } from '@stoplight/types';

// fragment with no servers
export const emptyServersFragment: Pick<IHttpService, 'servers'> = {
  servers: undefined,
};
