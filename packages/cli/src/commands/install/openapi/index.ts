import { OperationCanceledError } from '#errors';
import console from '#libs/console';
import type { Remix } from '#libs/mcp-clients';

import createRemix from './create-remix.ts';
import generateRemixDefinition from './generate-remix.ts';
import negotiateFilepath from './negotiate-filepath.ts';

export default async function createOpenAPIRemix(location: string): Promise<Remix> {
  const cwd = process.cwd();
  console.start('Generating OpenAPI openmcp definition...');
  try {
    const remix = await negotiateFilepath(cwd);
    const definition = await generateRemixDefinition(remix, location);
    await createRemix(cwd, remix.filepath, definition);

    return {
      name: 'openmcp',
      target: remix.filepath,
    };
  } catch (error) {
    if (error instanceof OperationCanceledError) {
      throw error;
    } else {
      throw new Error(
        `Failed to generate OpenAPI openmcp definition: ${error instanceof Error ? error.message : error}`,
      );
    }
  }
}
