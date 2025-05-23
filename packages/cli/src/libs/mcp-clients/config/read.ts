import { parseDocument } from '@openmcp/utils/documents';
import type { z } from 'zod';

import type { Context, FsInstallMethod } from '../types.ts';
import resolveConfigPath from './resolve-path.ts';

export default async function readConfig<I extends FsInstallMethod>(
  { constants, fs, logger }: Context,
  installMethod: I,
): Promise<z.infer<I['schema']>> {
  const resolvedConfigPath = resolveConfigPath(constants, installMethod.filepath);
  logger.start(`Loading config from "${resolvedConfigPath}"`);
  const content = await fs.readFile(resolvedConfigPath, 'utf8');
  const fileExtension = resolvedConfigPath.split('.').pop() || '';
  let document;
  try {
    document = parseDocument(content, fileExtension);
  } catch (error) {
    throw new Error(`Error parsing config file: ${error instanceof Error ? error.message : String(error)}`);
  }

  const result = installMethod.schema.safeParse(document);
  if (result.error) {
    throw new Error(`Error validating config file: ${result.error.issues.map(issue => issue.message).join(', ')}`);
  }

  logger.success('Config was loaded successfully');

  return result.data;
}
