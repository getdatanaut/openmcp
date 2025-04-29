import { z } from 'zod';

const TRANSPORT_SCHEMA = z
  .object({
    command: z.literal('npx'),
    args: z.array(z.string()),
  })
  .passthrough();

export default function findRemix(transport: unknown, remixId: string): boolean {
  const result = TRANSPORT_SCHEMA.safeParse(transport);
  if (!result.success) {
    return false;
  }

  if (result.data.args.length <= 3) {
    return false;
  }

  let isOpenmcpCli = false;
  let isServerArg = false;
  for (let i = 0; i < result.data.args.length; i++) {
    const arg = result.data.args[i]!;
    if (!isOpenmcpCli && arg.startsWith('@openmcp/cli')) {
      isOpenmcpCli = true;
    } else if (isOpenmcpCli && !isServerArg && arg === '--server') {
      isServerArg = true;
    } else if (isServerArg && arg === remixId) {
      return true;
    }
  }

  return false;
}
