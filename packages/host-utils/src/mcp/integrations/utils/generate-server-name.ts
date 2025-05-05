import slugify from '@sindresorhus/slugify';

import type { Server } from '../../types.ts';
import type { InstalledServer } from './types.ts';

export default function generateServerName(installedServers: readonly InstalledServer[], server: Server): string {
  const names = installedServers.map(s => s.name);
  const base = slugify(server.name);
  let i = 1;
  let name = base;
  while (names.includes(name)) {
    name = `${base}-${++i}`;
  }

  return name;
}
