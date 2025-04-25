import * as assert from 'node:assert/strict';

import { isPlainObject } from '@stoplight/json';

import type { LoadedDocument } from './types.ts';

export function assertIsLoadedDocument(document: unknown): asserts document is LoadedDocument {
  assert.ok(isPlainObject(document), 'OpenAPI specification is not valid');
  assert.ok(Object.hasOwn(document, 'paths'), 'OpenAPI specification does not contain paths');
  assert.ok(isPlainObject(document['paths']), 'OpenAPI specification paths is not an object');
}
