import { isPlainObject } from '@stoplight/json';
import type { IHttpOperation, IHttpOperationRequestBody } from '@stoplight/types';
import type { JSONSchema7 } from 'json-schema';
import { unwrapOrForResult } from 'option-t/plain_result';

import { tryIntoArray } from '../../../utils/accessors.ts';

export function getOperationInputSchema(operation: IHttpOperation<false>) {
  const request = operation.request;
  if (!request) return;
  const params = [
    ...unwrapOrForResult(tryIntoArray(request.path), []),
    ...unwrapOrForResult(tryIntoArray(request.query), []),
    ...unwrapOrForResult(tryIntoArray(request.headers), []),
    ...unwrapOrForResult(tryIntoArray(request.cookie), []),
  ] as const;

  const schema = {
    type: 'object',
    properties: {} as Record<string, JSONSchema7>,
    required: [] as string[],
  } satisfies JSONSchema7;

  const body = getBody(request.body);
  if (isPlainObject(body)) {
    schema.properties['body'] = body;
    if (request.body?.required) {
      schema.required.push('body');
    }
  }

  for (const param of params) {
    schema.properties[param.name] = {
      type: 'string',
      description: param.description,
      ...(isPlainObject(param.schema) ? param.schema : {}),
    };

    if (param.required) {
      schema.required.push(param.name);
    }
  }

  return schema;
}

function getBody(body: IHttpOperationRequestBody<false> | undefined): unknown {
  if (body) {
    return body.contents?.find(c => c.schema)?.schema;
  }

  return;
}

export function getOperationOutputSchema(operation: IHttpOperation<false>): JSONSchema7 {
  const successResponses = {};
  const successRegex = /2(\d{2}|xx)/i;
  for (const response of operation.responses) {
    if (successRegex.test(response.code)) {
      const content = response.contents?.find(c => c.schema);
      if (content) {
        successResponses[response.code] = content.schema;
      }
    }
  }

  // no sorting needed, we're making use of the fact that we deal with numeric keys
  const keys = Object.keys(successResponses);
  return keys.length > 0 ? successResponses[keys[0]!] : { type: 'object' };
}
