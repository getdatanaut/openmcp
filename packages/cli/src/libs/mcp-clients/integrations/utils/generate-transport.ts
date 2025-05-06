import path from 'node:path';

import type { InstallMethodLocation, Server } from '../../types.ts';

export default function generateTransport(server: Server, configFilepath: string, location: InstallMethodLocation) {
  const args = ['-y', 'openmcp@latest', 'run'];
  // @todo: remove --config / --server flags once run is updated
  if (server.target.startsWith('ag_')) {
    args.push('--server', server.target);
  } else if (location === 'global') {
    args.push('--config', server.target);
  } else if (location === 'local') {
    args.push('--config', path.relative(path.dirname(configFilepath), server.target));
  }

  return {
    command: 'npx',
    args,
  } as const;
}
