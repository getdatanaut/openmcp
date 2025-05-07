import type { InstallLocation, InstallMethod } from '../../types.ts';

export default function findMatchingInstallMethod<I extends InstallMethod>(
  methods: I[],
  location: InstallLocation,
): I | null {
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

  return null;
}
