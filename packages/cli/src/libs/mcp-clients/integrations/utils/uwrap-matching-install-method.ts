import InstallLocationUnavailable from '../../errors/install-method-unavailable.ts';
import type { InstallLocation, InstallMethod, Server } from '../../types.ts';
import findMatchingInstallMethod from './find-matching-install-method.ts';

export default function unwrapMatchingInstallMethod<I extends InstallMethod>(
  methods: I[],
  server: Server,
  location: InstallLocation,
): I {
  const method = findMatchingInstallMethod(methods, location);
  if (method === null) {
    throw new InstallLocationUnavailable(server, location === 'prefer-local' ? 'local' : location);
  }

  return method;
}
