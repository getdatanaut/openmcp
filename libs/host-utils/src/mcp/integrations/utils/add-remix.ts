import slugify from '@sindresorhus/slugify';

import { RemixConflict } from '../../errors/index.ts';
import type { Remix } from '../../types.ts';
import findRemix from './find-remix.ts';

function generateRemixName(target: Record<string, unknown>, remix: Remix) {
  const base = slugify(remix.name);
  let i = 1;
  let name = base;
  while (Object.hasOwn(target, name)) {
    name = `${base}-${++i}`;
  }

  return name;
}

export default function addRemix(target: Record<string, unknown>, remix: Remix, transport: unknown) {
  if (Object.values(target).some(server => findRemix(server, remix.id))) {
    throw new RemixConflict(remix);
  }

  const name = generateRemixName(target, remix);
  Object.assign(target, {
    [name]: transport,
  });
}
