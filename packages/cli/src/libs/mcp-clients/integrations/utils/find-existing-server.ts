import path from 'node:path';

import type { Server } from '../../types.ts';
import type { InstalledServer } from './types.ts';

function _findExistingServer(configFilepath: string, installedServer: InstalledServer, server: Server): boolean {
  if (installedServer.args.length <= 3) {
    return false;
  }

  let isOpenmcpCli = false;
  let currentFlag: string = '';
  for (let i = 0; i < installedServer.args.length; i++) {
    const arg = installedServer.args[i]!;
    if (!isOpenmcpCli) {
      isOpenmcpCli ||= arg.startsWith('openmcp');
      continue;
    }

    if (arg.startsWith('-')) {
      currentFlag = arg;
      continue;
    }

    switch (currentFlag) {
      case '--server':
        return arg === server.target;
      case '--config':
        return (
          (arg.startsWith('$') && arg === server.target) ||
          (path.isAbsolute(arg) ? arg : path.join(configFilepath, '..', arg)) === server.target
        );
    }
  }

  return false;
}

export default function findExistingServer(
  configFilepath: string,
  installedServers: readonly InstalledServer[],
  server: Server,
): number {
  return installedServers.findIndex(installedServer => _findExistingServer(configFilepath, installedServer, server));
}
