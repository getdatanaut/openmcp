import type { IHttpService } from '@stoplight/types';

// fragment with empty security array
export const emptySecurityArrayFragment: Pick<IHttpService, 'security' | 'securitySchemes'> = {
  security: [],
  securitySchemes: undefined,
};
