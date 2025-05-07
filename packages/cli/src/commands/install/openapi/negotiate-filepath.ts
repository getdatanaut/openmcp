import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import { parseDocument } from '@openmcp/utils/documents';

import { OperationCanceledError } from '#errors';
import console from '#libs/console';
import * as prompt from '#libs/console/prompts';
import { getInstallFilepath, type InstallLocation, type IntegrationName } from '#libs/mcp-clients';
import { type Config as RemixDefinition, parseConfig } from '#libs/remix';

function getDefaultLocation(cwd: string, client: IntegrationName, installLocation: InstallLocation): string {
  const filename = 'openmcp.json';
  if (installLocation === 'global') {
    return path.join(cwd, filename);
  }

  const localInstallPath = getInstallFilepath(cwd, client, 'local');
  if (localInstallPath === null) {
    return path.join(cwd, filename);
  }

  return path.join(path.dirname(localInstallPath), filename);
}

export default async function negotiateFilepath(
  cwd: string,
  client: IntegrationName,
  installLocation: InstallLocation,
): Promise<{ definition: RemixDefinition | null; filepath: string }> {
  while (true) {
    const defaultValue = getDefaultLocation(cwd, client, installLocation);
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
    let content;

    try {
      content = await fs.readFile(filepath, 'utf8');
    } catch (error) {
      if (!(error instanceof Error)) {
        console.error(formatErrorMessage(`Failed to read file at ${strFilepath}`, error));
        continue;
      }

      switch ((error as NodeJS.ErrnoException).code) {
        case 'ENOENT':
          return {
            definition: null,
            filepath,
          };
        case 'EISDIR':
          console.error(`The specified path ${strFilepath} is a directory.`);
          continue;
        case 'EPERM':
        case 'EACCES':
          console.error(formatErrorMessage(`Permission denied to read file at ${strFilepath}`, error));
          continue;
        case undefined:
        default:
          console.error(formatErrorMessage(`Failed to read file at ${strFilepath}`, error));
          continue;
      }
    }

    try {
      const definition = parseConfig(parseDocument(content, 'jsonc'));
      console.info(
        `Found an existing openmcp definition at ${strFilepath}. If you want to create a new openmcp definition, please specify a different filepath or delete the file first.`,
      );
      return {
        definition,
        filepath,
      };
    } catch {
      const res = await prompt.confirm({
        message: `The specified path ${strFilepath} exists but does not contain a valid openmcp definition. Do you want to continue? This process will overwrite the file.`,
        defaultValue: false,
      });
      if (!res) {
        throw new OperationCanceledError();
      }

      return {
        definition: null,
        filepath,
      };
    }
  }
}

function formatErrorMessage(message: string, error: unknown): string {
  const errorMessage = error instanceof Error ? error.message : null;
  return `${errorMessage ? `${message}: ${errorMessage}` : message}. Please specify a different path.`;
}
