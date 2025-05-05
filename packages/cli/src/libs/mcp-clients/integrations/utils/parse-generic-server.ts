import { z } from 'zod';

const SERVER_SCHEMA = z
  .object({
    command: z.literal('npx'),
    args: z.array(z.string()),
  })
  .passthrough();

export default function parseGenericServer(maybeServer: unknown): z.infer<typeof SERVER_SCHEMA> | null {
  const result = SERVER_SCHEMA.safeParse(maybeServer);
  if (!result.success) {
    return null;
  }

  return result.data;
}
