import { ServerConflict } from '../../errors/index.ts';
import type { Server } from '../../types.ts';
import findExistingServer from './find-existing-server.ts';
import type { InstalledServer } from './types.ts';

export function assertNoExistingServer(installedServers: readonly InstalledServer[], server: Server) {
  if (findExistingServer(installedServers, server) >= 0) {
    throw new ServerConflict(server);
  }
}
