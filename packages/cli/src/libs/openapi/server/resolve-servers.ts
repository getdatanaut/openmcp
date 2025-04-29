import type { IHttpService } from '@stoplight/types';

import resolveTemplatedServer, { isTemplatedServer } from './resolve-templated-server.ts';

export type ResolvedServer = {
  name: string | undefined;
  value: string;
  valid: boolean;
};

function toResolvedServer(name: string | undefined, url: string): ResolvedServer {
  return {
    name,
    value: url,
    valid: URL.canParse(url),
  };
}

export default function resolveServers(service: Pick<IHttpService, 'servers'>): ResolvedServer[] {
  return (
    service.servers?.flatMap<ResolvedServer>(server =>
      isTemplatedServer(server)
        ? resolveTemplatedServer(server).map(url => toResolvedServer(server.description ?? server.name, url))
        : toResolvedServer(server.description ?? server.name, server.url),
    ) ?? []
  );
}
