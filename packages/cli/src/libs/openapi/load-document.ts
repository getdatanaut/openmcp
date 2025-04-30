import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import { isPlainObject, parseWithPointers as parseJsonWithPointers } from '@stoplight/json';
import { DiagnosticSeverity, type IDiagnostic } from '@stoplight/types';
import { parseWithPointers as parseYamlWithPointers } from '@stoplight/yaml';

function assertValidDocument(result: {
  data: unknown;
  diagnostics: IDiagnostic[];
}): asserts result is { data: Record<string, unknown>; diagnostics: IDiagnostic[] } {
  for (const diagnostic of result.diagnostics) {
    if (diagnostic.severity === DiagnosticSeverity.Error) {
      throw new Error(`Failed to parse document: ${diagnostic.message}`);
    }
  }

  if (!isPlainObject(result.data)) {
    throw new Error('Failed to parse document: document is not an object');
  }
}

export default async function loadDocument(filepath: string): Promise<Record<string, unknown>> {
  const content = await fs.readFile(filepath, 'utf8');
  switch (path.extname(filepath)) {
    case '.json': {
      const result = parseJsonWithPointers(content);
      assertValidDocument(result);
      return result.data;
    }
    case '.yaml':
    case '.yml': {
      const result = parseYamlWithPointers(content);
      assertValidDocument(result);
      return result.data;
    }
    default:
      throw new Error(`Unsupported file type: ${filepath}`);
  }
}
