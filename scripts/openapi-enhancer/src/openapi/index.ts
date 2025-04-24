import * as assert from 'node:assert/strict';

import { isPlainObject } from '@stoplight/json';
import { safeStringify } from '@stoplight/yaml';

import applyOperation, { type Operation } from '../json-patch/apply.ts';
import { bundleDocument, loadFile } from './openapi.ts';

class LoadedDocument {
  #document: Record<string, unknown>;
  readonly patchErrors: unknown[] = [];

  constructor(document: Record<string, unknown>) {
    this.#document = document;
  }

  applyOperation(operation: Operation) {
    applyOperation(this.#document, operation);
  }

  toString() {
    return safeStringify(this.#document, {
      indent: 2,
      noRefs: true,
      lineWidth: -1,
    });
  }
}

export async function loadDocument(filepath: string): Promise<LoadedDocument> {
  const openapi = await loadFile(filepath);
  assert.ok(isPlainObject(openapi), 'OpenAPI specification is not valid');

  const bundledDocument = await bundleDocument(openapi);
  return new LoadedDocument(bundledDocument);
}
