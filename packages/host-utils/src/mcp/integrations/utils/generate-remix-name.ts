import slugify from '@sindresorhus/slugify';

import type { Remix } from '../../types.ts';

export default function generateRemixName(target: Record<string, unknown>, remix: Remix) {
  const base = slugify(remix.name);
  let i = 1;
  let name = base;
  while (Object.hasOwn(target, name)) {
    name = `${base}-${++i}`;
  }

  return name;
}
