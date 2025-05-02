import * as path from 'node:path';

import type { Remix } from '@openmcp/host-utils/mcp';

import console from '#libs/console';

import negotiatedCreateRemix from './create-remix.ts';
import generateRemixDefinition from './generate-remix.ts';

export default async function createOpenAPIRemix(filepath: string): Promise<Remix> {
  const cwd = process.cwd();
  console.start('Generating OpenAPI openmcp definition...');
  try {
    const remix = await generateRemixDefinition(path.resolve(cwd, filepath));
    const remixFilepath = await negotiatedCreateRemix(cwd, remix.definition);

    return {
      id: remix.id,
      name: remix.name,
      filepath: remixFilepath,
    };
  } catch (error) {
    throw new Error(`Failed to generate OpenAPI openmcp definition: ${error}`);
  }
}
