import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import jsp from '@stoplight/json-schema-ref-parser';
import { parse as parseYaml } from '@stoplight/yaml';

/**
 * Loads an OpenAPI specification from a file
 * @param filepath The path to the OpenAPI specification file
 * @returns The loaded OpenAPI specification
 */
export async function loadFile(filepath: string): Promise<unknown> {
  let fileContent: string;
  try {
    fileContent = await fs.readFile(filepath, 'utf8');
  } catch (error) {
    throw new Error('Failed to load OpenAPI specification', { cause: error });
  }

  const ext = path.extname(filepath);
  switch (ext) {
    case '.json':
      return JSON.parse(fileContent);
    case '.yaml':
    case '.yml':
      return parseYaml(fileContent);
    default:
      throw new Error(`Unsupported file extension: ${ext}`);
  }
}

export async function bundleDocument(document: Record<string, unknown>): Promise<Record<string, unknown>> {
  const result = await jsp.bundle(document, {
    continueOnError: false,
  });
  return result as Record<string, unknown>;
}
