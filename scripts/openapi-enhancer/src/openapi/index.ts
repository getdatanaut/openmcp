import * as assert from 'node:assert/strict';

import { isPlainObject } from '@stoplight/json';

import { assertIsLoadedDocument } from './guards.ts';
import { bundleDocument, loadFile } from './openapi.ts';
import type { LoadedDocument } from './types.ts';

export { default as getChunks } from './chunks/index.ts';
export type { OperationChunk } from './chunks/operation/operation.ts';
export type { ServiceChunk } from './chunks/service.ts';
export { type LoadedDocument } from './types.ts';

export async function loadDocument(filepath: string): Promise<LoadedDocument> {
  const openapi = await loadFile(filepath);
  assert.ok(isPlainObject(openapi), 'OpenAPI specification is not valid');
  const bundled = await bundleDocument(openapi);
  assertIsLoadedDocument(bundled);
  return bundled;
}
