import { z } from 'zod';

import type { Remix } from '../../types.ts';

const TRANSPORT_SCHEMA = z.union([
  z
    .object({
      command: z.literal('npx'),
      args: z.array(z.string()),
    })
    .passthrough(),
  z
    .object({
      cmd: z.literal('node'),
      args: z.array(z.string()),
    })
    .passthrough(),
]);

export default function findRemix(transport: unknown, remix: Remix): boolean {
  const result = TRANSPORT_SCHEMA.safeParse(transport);
  if (!result.success) {
    return false;
  }

  if (result.data.args.length <= 3) {
    return false;
  }

  let isOpenmcpCli = false;
  let currentFlag: string = '';
  for (let i = 0; i < result.data.args.length; i++) {
    const arg = result.data.args[i]!;
    if (!isOpenmcpCli) {
      isOpenmcpCli ||= arg.startsWith('openmcp');
      continue;
    }

    if (arg.startsWith('-')) {
      currentFlag = arg;
      continue;
    }

    switch (currentFlag) {
      case '--server':
        return arg === remix.id;
      case '--config':
        return arg === remix.filepath;
    }
  }

  return false;
}
