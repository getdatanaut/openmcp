import { inferTargetType } from '#libs/mcp-utils';

import type { Server } from '../../types.ts';

export default function generateTransport(server: Server) {
  const args = ['-y', 'openmcp@latest', 'run'];
  // @todo: remove --config / --server flags once run is updated
  switch (inferTargetType(server.target)) {
    case 'agent-id':
      args.push('--server', server.target);
      break;
    case 'openapi':
      args.push('--config', server.target);
      break;
  }

  return {
    command: 'npx',
    args,
  } as const;
}
