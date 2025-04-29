import type { IHttpService } from '@stoplight/types';

// fragment with empty servers array
export const emptyServersArrayFragment: Pick<IHttpService, 'servers'> = {
  servers: [],
};
