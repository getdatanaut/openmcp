import { OPERATION_CONFIG } from '@stoplight/http-spec/oas';
import { transformOas2Operation, transformOas2Service } from '@stoplight/http-spec/oas2';
import { transformOas3Operation, transformOas3Service } from '@stoplight/http-spec/oas3';
import { isPlainObject } from '@stoplight/json';
import type { IHttpOperation } from '@stoplight/types';

function isOas3(document: Record<string, unknown>) {
  return 'openapi' in document;
}

export function transformOasService(document: Record<string, unknown>) {
  if (isOas3(document)) {
    return transformOas3Service({ document });
  }

  return transformOas2Service({ document });
}

export function* transformOasOperations(document: Record<string, unknown>): Iterable<IHttpOperation> {
  const paths = document['paths'];
  if (!isPlainObject(paths)) return;

  const verbs = new Set(['get', 'post', 'put', 'delete', 'options', 'head', 'patch']);
  if (isOas3(document)) {
    verbs.add('trace');
  }

  const transformOperation = isOas3(document) ? transformOas3Operation : transformOas2Operation;
  for (const [path, pathItem] of Object.entries(paths)) {
    if (!isPlainObject(pathItem)) continue;
    for (const prop of Object.keys(pathItem)) {
      if (!verbs.has(prop)) continue;
      yield {
        path,
        ...transformOperation({
          document,
          config: OPERATION_CONFIG,
          name: path,
          method: prop,
        }),
      };
    }
  }
}
