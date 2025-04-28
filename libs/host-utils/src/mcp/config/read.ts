import { parseWithPointers } from '@stoplight/json';
import { DiagnosticSeverity, type IDiagnostic } from '@stoplight/types';
import type { z } from 'zod';

import type { Context, FsInstallMethod } from '../types.ts';
import resolveConfigPath from './resolve-path.ts';

function isErrorDiagnostic(
  diagnostic: IDiagnostic,
): diagnostic is IDiagnostic & { severity: DiagnosticSeverity.Error } {
  return diagnostic.severity === DiagnosticSeverity.Error;
}

export default async function readConfig<I extends FsInstallMethod>(
  { constants, fs, logger }: Context,
  installMethod: I,
): Promise<z.infer<I['schema']>> {
  const resolvedConfigPath = resolveConfigPath(constants, installMethod.filepath);
  logger.start(`Loading config from "${resolvedConfigPath}"`);
  const content = await fs.readFile(resolvedConfigPath, 'utf8');
  const { data, diagnostics } = parseWithPointers(content, {
    allowTrailingComma: true,
  });

  const errorDiagnostics = diagnostics.filter(isErrorDiagnostic);

  if (errorDiagnostics.length > 0) {
    throw new Error(
      `Error parsing config file: ${errorDiagnostics
        .map(
          diagnostic =>
            ' '.repeat(2) +
            `${diagnostic.message} at ${diagnostic.range.start.line + 1}:${diagnostic.range.start.character + 1}`,
        )
        .join('\n')}`,
    );
  }

  const result = installMethod.schema.safeParse(data);
  if (result.error) {
    throw new Error(`Error validating config file: ${result.error.issues.map(issue => issue.message).join(', ')}`);
  }

  logger.success('Config was loaded successfully');

  return result.data;
}
