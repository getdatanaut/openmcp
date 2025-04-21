import { mkdir, readFile as fsReadFile, writeFile as fsWriteFile } from 'node:fs/promises';
import { join } from 'node:path';

import env from '../env.ts';

/**
 * Gets the path to a file in the configuration directory
 * @param filename The name of the file
 * @returns The full path to the file
 */
export function getFilePath(filename: string): string {
  return join(env.DN_HOME_DIR, filename);
}

/**
 * Reads data from a file in the configuration directory
 * @param filename The name of the file to read
 * @returns The file contents as a string, or null if the file doesn't exist
 */
export async function readFile(filename: string): Promise<string | null> {
  try {
    return await fsReadFile(getFilePath(filename), 'utf-8');
  } catch {
    return null;
  }
}

/**
 * Writes data to a file in the configuration directory
 * @param filename The name of the file to write
 * @param data The data to write to the file
 */
export async function writeFile(filename: string, data: string): Promise<void> {
  await ensureConfigDirExists();
  await fsWriteFile(getFilePath(filename), data, 'utf8');
}

/**
 * Ensures that the configuration directory exists
 */
async function ensureConfigDirExists(): Promise<void> {
  await mkdir(env.DN_HOME_DIR, { recursive: true });
}
