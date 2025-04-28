import type { Remix } from '../types.ts';

export default class RemixConflict extends Error {
  constructor(remix: Remix) {
    super(`Server "${remix.name}" is already installed.`);
  }
}
