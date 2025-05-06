import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import console from '#libs/console';
import * as prompt from '#libs/console/prompts';
import type { Config as RemixConfig } from '#libs/remix';

export default async function negotiatedCreateRemix(cwd: string, remix: RemixConfig): Promise<string> {
  while (true) {
    const defaultValue = path.join(cwd, 'openmcp.json');
    const filepath = path.resolve(
      cwd,
      (await prompt.text({
        message: 'Please insert location for your openmcp definition:',
        placeholder: defaultValue,
        validate: value => {
          if (value.trim().length === 0) {
            return 'Path cannot be empty';
          }
        },
      })) || defaultValue,
    );

    const strFilepath = JSON.stringify(filepath);

    try {
      const stats = await fs.stat(filepath);
      if (!stats.isFile()) {
        console.error(formatErrorMessage(`The specified path ${strFilepath} already exists and is not a file.`, null));
        continue;
      }

      console.info(
        `Updated OpenAPI openmcp definition at ${strFilepath}. If the definition is already used, you may need to restart your client for the changes to take effect.`,
      );
      await fs.writeFile(filepath, JSON.stringify(remix, null, 2));
      return filepath;
    } catch {
      // the file presumably does not exist, or we simply could not stat it for other reasons
      // we'll try to create a directory / file down below, and it fails, we'll handle the exception there
    }

    const dirname = path.dirname(filepath);
    if (dirname !== cwd) {
      try {
        await fs.mkdir(cwd, { recursive: true });
      } catch (error) {
        console.error(formatErrorMessage(`Failed to create directory at ${JSON.stringify(dirname)}`, error));
        continue;
      }
    }

    try {
      await fs.writeFile(filepath, JSON.stringify(remix, null, 2));
      console.success(`Created OpenAPI openmcp definition at ${strFilepath}`);
      return filepath;
    } catch (error) {
      console.error(formatErrorMessage(`Failed to write file at ${strFilepath}`, error));
    }
  }
}

const getErrorMessage = (error: unknown): string | null => (error instanceof Error ? error.message : null);

function formatErrorMessage(message: string, error: unknown): string {
  const errorMessage = getErrorMessage(error);
  return `${errorMessage ? `${message}: ${errorMessage}` : message}. Please specify a different path.`;
}
