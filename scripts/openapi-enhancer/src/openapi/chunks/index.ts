import { bundleOas2Service } from '@stoplight/http-spec/oas2';
import { bundleOas3Service } from '@stoplight/http-spec/oas3';

import type { LoadedDocument } from '../types.ts';
import { createOperationChunk, type OperationChunk } from './operation/index.ts';
import { createServiceChunk, type ServiceChunk } from './service.ts';

export default function* getChunks(document: LoadedDocument): Iterable<ServiceChunk | OperationChunk> {
  const service = bundleOasService(document);
  yield createServiceChunk(document, service);

  for (const operation of service.operations) {
    yield createOperationChunk(document, service, operation);
  }
}

function bundleOasService(result: Record<string, unknown>) {
  const bundle = 'openapi' in result ? bundleOas3Service : bundleOas2Service;
  return bundle({ document: result });
}
