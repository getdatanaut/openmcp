import { dirname } from 'node:path';

import { serializeDocument } from '@openmcp/utils/documents';
import type { z } from 'zod';

import { isEnoentError } from '../../../errors/guards.ts';
import type { Context, FsInstallMethod } from '../types.ts';
import readConfig from './read.ts';
import resolveConfigPath from './resolve-path.ts';

export default async function writeConfig<I extends FsInstallMethod>(
  ctx: Context,
  installMethod: I,
  applyConfig: (config: z.infer<I['schema']>, filepath: string) => Promise<void>,
): Promise<void> {
  const resolvedConfigPath = resolveConfigPath(ctx.constants, installMethod.filepath);
  let config: z.infer<I['schema']>;
  try {
    config = await readConfig(ctx, installMethod);
  } catch (error) {
    if (!isEnoentError(error)) {
      throw error;
    }

    ctx.logger.info('Config does not exist yet');
    await ctx.fs.mkdir(dirname(resolvedConfigPath), { recursive: true });
    config = {};
  }

  await applyConfig(config, resolvedConfigPath);
  const ext = resolvedConfigPath.slice(resolvedConfigPath.lastIndexOf('.') + 1);
  if (ext === 'json') {
    await ctx.fs.writeFile(resolvedConfigPath, serializeDocument(config, 'json'));
  } else {
    await ctx.fs.writeFile(resolvedConfigPath, serializeDocument(config, 'yaml'));
  }

  ctx.logger.success('Config was saved successfully');
}
