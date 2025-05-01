import type { Remix } from '../../types.ts';

export default function generateTransport(remix: Remix) {
  const args = ['@openmcp/cli@latest', 'run'];
  if (remix.filepath) {
    args.push('--config', remix.filepath);
  } else {
    args.push('--server', remix.id);
  }

  return {
    command: 'npx',
    args,
  } as const;
}
