import parseDocument from './parse.ts';
import readDocument, { type IO } from './read.ts';

export type LoadOptions = {
  /**
   * @defaultValue {false}
   */
  parseJsonAsJsonc?: boolean;
};

/**
 * Loads a document from a specified location, processes its content based on the
 * document type, and returns the parsed result.
 *
 * @param {IO} io - The IO interface providing methods for reading the document content.
 * @param location - The location or path from which the document will be loaded.
 * @param {LoadOptions} [options={}] - Optional configuration for loading the document, such as parsing options.
 * @return {Promise<Record<string, unknown>>} A promise that resolves to the parsed contents of the document as a record.
 */
export default async function loadDocument(
  io: IO,
  location: string,
  options: LoadOptions = {},
): Promise<Record<string, unknown>> {
  const { content, type } = await readDocument(io, location);
  if (type === 'json' && options.parseJsonAsJsonc) {
    return parseDocument(content, 'jsonc');
  }

  return parseDocument(content, type);
}
