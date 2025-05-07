import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import console from '#libs/console';
import type { Config as RemixDefinition } from '#libs/remix';

export default async function createRemix(cwd: string, filepath: string, remix: RemixDefinition): Promise<void> {
  const dirname = path.dirname(filepath);
  if (dirname !== cwd) {
    try {
      await fs.mkdir(cwd, { recursive: true });
    } catch (error) {
      throw new Error(formatErrorMessage(`Failed to create directory at ${JSON.stringify(dirname)}`, error));
    }
  }

  const strFilepath = JSON.stringify(filepath);

  try {
    await fs.writeFile(filepath, JSON.stringify(remix, null, 2));
    console.success(`Created OpenAPI openmcp definition at ${strFilepath}`);
  } catch (error) {
    throw new Error(formatErrorMessage(`Failed to write file at ${strFilepath}`, error));
  }
}

function formatErrorMessage(message: string, error: unknown): string {
  const errorMessage = error instanceof Error ? error.message : null;
  return `${errorMessage ? `${message}: ${errorMessage}` : message}`;
}
