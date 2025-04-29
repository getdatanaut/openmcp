import type { IHttpService } from '@stoplight/types';

// fragment with no security
export const emptySecurityFragment: Pick<IHttpService, 'security' | 'securitySchemes'> = {
  security: undefined,
  securitySchemes: undefined,
};
