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

/**
 * Parses the provided document content based on the specified file type.
 * Supports JSON, JSONC, and YAML files.
 *
 * @param content - The document content to be parsed.
 * @param type - The type of the document (e.g., 'json', 'jsonc', 'yaml', 'yml').
 * @return The parsed data extracted from the document.
 * @throws {Error} If the provided file type is unsupported or the content is invalid.
 */
export default function parseDocument(content: string, type: string): Record<string, unknown> {
  switch (type) {
    case 'jsonc': {
      const result = parseJsonWithPointers(content, {
        allowTrailingComma: true,
        disallowComments: false,
      });
      assertValidDocument(result);
      return result.data;
    }
    case 'json': {
      const result = parseJsonWithPointers(content);
      assertValidDocument(result);
      return result.data;
    }
    case 'yaml':
    case 'yml': {
      const result = parseYamlWithPointers(content);
      assertValidDocument(result);
      return result.data;
    }
    default:
      throw new Error(`Unsupported file type: ${type}`);
  }
}
