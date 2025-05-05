import { InstallLocationUnavailable } from '../../errors/index.ts';
import type { InstallLocation, InstallMethod, Server } from '../../types.ts';

export default function findMatchingInstallMethod<I extends InstallMethod>(
  methods: I[],
  server: Server,
  location: InstallLocation,
): I {
  let globalMethod: I | null = null;
  for (const method of methods) {
    if (method.location === location) {
      return method;
    }

    if (method.location === 'local' && location === 'prefer-local') {
      return method;
    }

    if (method.location === 'global') {
      globalMethod = method;
    }
  }

  if (globalMethod !== null && location === 'prefer-local') {
    return globalMethod;
  }

  throw new InstallLocationUnavailable(server, location === 'prefer-local' ? 'local' : location);
}
