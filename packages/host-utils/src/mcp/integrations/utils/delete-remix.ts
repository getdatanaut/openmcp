import { RemixNotInstalled } from '../../errors/index.ts';
import type { Remix } from '../../types.ts';
import findRemix from './find-remix.ts';

export default function deleteRemix(servers: unknown, remix: Remix) {
  if (typeof servers !== 'object' || servers === null || Array.isArray(servers)) {
    throw new RemixNotInstalled(remix);
  }

  const entries = Object.entries(servers) as [string, unknown][];
  const entry = entries.find(([, server]) => findRemix(server, remix));
  if (!entry) {
    throw new RemixNotInstalled(remix);
  }

  delete servers[entry[0]];
}
