import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import type { Config as RemixConfig } from '@openmcp/remix';

import console, { prompt } from '#libs/console';

export default async function negotiatedCreateRemix(cwd: string, remix: RemixConfig): Promise<string> {
  while (true) {
    const filepath = path.resolve(
      cwd,
      await prompt.text({
        message: 'Please insert location for your remix definition:',
        placeholder: path.join(cwd, 'openmcp.json'),
        defaultValue: path.join(cwd, 'openmcp.json'),
      }),
    );

    const dirname = path.dirname(filepath);
    if (dirname !== cwd) {
      try {
        await fs.mkdir(cwd, { recursive: true });
      } catch (error) {
        console.error(`Failed to create directory: ${getErrorMessage(error)}. Please specify a different path.`);
        continue;
      }
    }

    try {
      await fs.writeFile(filepath, JSON.stringify(remix, null, 2));
      return filepath;
    } catch (error) {
      console.error(`Failed to write file: ${getErrorMessage(error)}. Please specify a different path.`);
    }
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  } else {
    return 'N/A';
  }
}
