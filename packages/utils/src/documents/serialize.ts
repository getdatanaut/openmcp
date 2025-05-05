import { safeStringify } from '@stoplight/yaml';

/**
 * Serializes the provided document into the specified format.
 *
 * @param document - The document to be serialized.
 * @param type - The format type for serialization. Supported values are 'json', 'jsonc', 'yaml', and 'yml'.
 * @return The serialized string based on the specified format.
 * @throws {Error} Throws an error if the provided type is unsupported.
 */
export default function serializeDocument(document: unknown, type: string): string {
  switch (type) {
    case 'jsonc':
    case 'json': {
      return JSON.stringify(document, null, 2);
    }
    case 'yaml':
    case 'yml': {
      return safeStringify(document, {
        noRefs: true,
        indent: 2,
        skipInvalid: true,
      });
    }
    default:
      throw new Error(`Unsupported file type: ${type}`);
  }
}
