import { transformOas2Service } from '@stoplight/http-spec/oas2';
import { transformOas3Service } from '@stoplight/http-spec/oas3';
import type { IHttpService } from '@stoplight/types';

export const transformService = (document: Record<string, unknown>): IHttpService =>
  'openapi' in document ? transformOas3Service({ document }) : transformOas2Service({ document });

export type { IHttpService };
export { type ResolvedSecurityScheme, resolveSecuritySchemes } from './security/index.ts';
export { type ResolvedServer, resolveServers } from './server/index.ts';
