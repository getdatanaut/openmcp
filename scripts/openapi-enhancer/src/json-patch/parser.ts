import clarinet from 'clarinet';
import { createErr, createOk, type Result } from 'option-t/plain_result';
import type { z } from 'zod';

import { JsonPatchOperationSchema } from './schemas.ts';

export type ParseResult = Result<z.infer<typeof JsonPatchOperationSchema>, Error>;

export default function createSAXJsonPatchParser() {
  let curObj;
  let openedObjects = 0;
  let lastKey = '';
  const objects: Record<string, unknown>[] = [];
  const parser = clarinet.parser();
  parser.onopenobject = function (key) {
    openedObjects++;
    lastKey = key;
    if (openedObjects === 2) {
      curObj = {};
    }
  };
  parser.oncloseobject = function () {
    openedObjects--;
    if (openedObjects === 1) {
      objects.push(curObj);
      curObj = {};
    }
  };
  parser.onkey = function (key) {
    lastKey = key;
    if (openedObjects === 2) {
      curObj[key] = undefined;
    }
  };
  parser.onvalue = function (value) {
    if (openedObjects === 2) {
      curObj[lastKey] = value;
    }
  };

  return {
    *[Symbol.iterator](): Iterator<ParseResult> {
      while (objects.length > 0) {
        const obj = objects.shift();
        const patch = JsonPatchOperationSchema.safeParse(obj);
        if (patch.success) {
          yield createOk(patch.data);
        } else {
          yield createErr(patch.error);
        }
      }
    },
    write(data: string) {
      parser.write(data);
    },
  };
}
