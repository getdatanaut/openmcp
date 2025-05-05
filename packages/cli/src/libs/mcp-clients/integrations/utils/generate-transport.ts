import type { Remix } from '../../types.ts';

export default function generateTransport(remix: Remix) {
  const args = ['-y', 'openmcp@latest', 'run'];
  // @todo: remove --config / --server flags once run is updated
  if (!remix.target.startsWith('ag_')) {
    args.push('--config', remix.target);
  } else {
    args.push('--server', remix.target);
  }

  return {
    command: 'npx',
    args,
  } as const;
}
