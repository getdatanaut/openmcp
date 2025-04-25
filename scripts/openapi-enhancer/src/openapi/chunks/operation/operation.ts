import assert from 'node:assert/strict';

import type { IBundledHttpService, IHttpOperation } from '@stoplight/types';
import type { JSONSchema7 } from 'json-schema';
import { isOk, unwrapOk, unwrapOrForResult } from 'option-t/plain_result';

import { tryInto, tryIntoString } from '../../../utils/accessors.ts';
import type { LoadedDocument } from '../../index.ts';
import { Chunk, type OmitReadonly } from '../chunk.ts';
import { createResolved } from './resolved.ts';
import { getOperationInputSchema, getOperationOutputSchema } from './schemas.ts';

type OperationData = {
  readonly path: string;
  readonly method: string;
  summary?: string;
  description?: string;
  readonly input?: JSONSchema7;
  readonly output?: JSONSchema7;
  deprecated?: boolean;
  readonly tags?: string[];
};

export class OperationChunk extends Chunk<'operation', OperationData> {
  readonly #operation: Record<string, unknown>;
  readonly id: string;

  constructor(document: LoadedDocument, data: OperationData) {
    super('operation', data);
    assert.ok(Object.hasOwn(document.paths, data.path), `Path ${data.path} not found in document`);
    const operation = tryInto(findOperation(document.paths[data.path]!, data.method), 'object');
    assert.ok(isOk(operation), `Operation ${data.method} not found in path ${data.path}`);
    this.#operation = unwrapOk(operation);

    this.id = unwrapOrForResult(
      tryIntoString(this.#operation['operationId']),
      `${this.data.method.toUpperCase()} ${this.data.path}`,
    );
  }

  override set<N extends keyof OmitReadonly<OperationData>>(name: N, value: NonNullable<OperationData[N]>) {
    super.set(name, value);
    switch (name) {
      case 'description':
      case 'summary':
      case 'deprecated': {
        this.#operation[name] = value;
        break;
      }
      default:
        throw new Error(`Cannot set field ${name} on operation`);
    }
  }

  override add(name: Exclude<string, keyof OperationData>, value: unknown) {
    this.#operation[name] = value;
    this.events.emit('add', name, value);
  }
}

function findOperation(operation: Record<string, unknown>, method: string) {
  for (const [key, value] of Object.entries(operation)) {
    if (key.toLowerCase() === method.toLowerCase()) {
      return value;
    }
  }

  return;
}

export function createOperationChunk(
  document: LoadedDocument,
  service: IBundledHttpService,
  operation: IHttpOperation<true>,
) {
  const resolvedOperation = createResolved(service, operation);
  const data = {
    path: operation.path,
    method: operation.method.toUpperCase(),
    deprecated: operation.deprecated,
    tags: operation.tags?.map(tag => tag.name),
    description: operation.description,
    summary: operation.summary,
    input: getOperationInputSchema(resolvedOperation),
    output: getOperationOutputSchema(resolvedOperation),
  } satisfies OperationData;

  return new OperationChunk(document, data);
}
