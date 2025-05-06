import { OperationCanceledError } from '#errors';
import console from '#libs/console';
import type { Remix } from '#libs/mcp-clients';

import negotiatedCreateRemix from './create-remix.ts';
import generateRemixDefinition from './generate-remix.ts';

export default async function createOpenAPIRemix(location: string): Promise<Remix> {
  const cwd = process.cwd();
  console.start('Generating OpenAPI openmcp definition...');
  try {
    const remix = await generateRemixDefinition(cwd, location);
    const remixFilepath = await negotiatedCreateRemix(cwd, remix.definition);

    return {
      id: remix.id,
      name: remix.name,
      target: remixFilepath,
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
