import { hasRef, isPlainObject, resolveInlineRefWithLocation } from '@stoplight/json';
import type { IBundledHttpService, IHttpOperation } from '@stoplight/types';

import type { LoadedDocument } from '../../types.ts';

/**
 * This isn't too optimized, so shouldn't be used anywhere else than this enhancer
 * where LLM is the actual limitation
 * @param document
 * @param data
 */
export function createResolved(document: IBundledHttpService, data: IHttpOperation<true>): IHttpOperation<false> {
  return _createResolvedObject(document, data, []) as unknown as IHttpOperation<false>;
}

function createResolvedArray(document: IBundledHttpService, data: unknown[], stack: string[]) {
  const elems: unknown[] = [];
  for (const elem of data) {
    if (Array.isArray(elem)) {
      elems.push(createResolvedArray(document, elem, stack.slice()));
    } else if (isPlainObject(elem)) {
      elems.push(_createResolvedObject(document, elem, stack.slice()));
    } else {
      elems.push(elem);
    }
  }

  return elems;
}

function _createResolvedObject(document: IBundledHttpService, data: {}, stack: string[]) {
  if (hasRef(data)) {
    if (stack.includes(data.$ref)) {
      return data.$ref;
    }

    const resolved = resolveInlineRefWithLocation(document as unknown as Record<string, unknown>, data.$ref);
    stack.push(data.$ref);
    resolved.location;
  }

  const newObj = { ...data };
  for (const key of Object.keys(newObj)) {
    const value = newObj[key];
    if (Array.isArray(value)) {
      newObj[key] = createResolvedArray(document, value, stack.slice());
    } else if (isPlainObject(value)) {
      newObj[key] = _createResolvedObject(document, value, stack.slice());
    } else if (typeof value === 'string' && value.startsWith('#/')) {
      newObj[key] = value;
    }
  }

  return newObj;
}
