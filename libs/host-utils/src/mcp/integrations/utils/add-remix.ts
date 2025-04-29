import { RemixConflict } from '../../errors/index.ts';
import type { Remix } from '../../types.ts';
import findRemix from './find-remix.ts';
import generateRemixName from './generate-remix-name.ts';

export default function addRemix(target: Record<string, unknown>, remix: Remix, transport: unknown) {
  if (Object.values(target).some(server => findRemix(server, remix.id))) {
    throw new RemixConflict(remix);
  }

  const name = generateRemixName(target, remix);
  Object.assign(target, {
    [name]: transport,
  });
}
