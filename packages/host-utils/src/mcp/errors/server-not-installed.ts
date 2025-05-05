import type { Remix } from '../types.ts';

export default class RemixNotInstalled extends Error {
  constructor(remix: Remix) {
    super(`Server "${remix.name}" is not installed`);
  }
}
