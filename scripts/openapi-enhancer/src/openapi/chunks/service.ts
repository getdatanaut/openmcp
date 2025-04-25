import type { IBundledHttpService } from '@stoplight/types';
import { unwrapOrElseForResult } from 'option-t/plain_result';

import { tryInto } from '../../utils/accessors.ts';
import { Chunk, type OmitReadonly } from './chunk.ts';

type ServiceData = {
  title: string;
  description: string;
  summary?: string;
  version: string;
  contact?: {
    name?: string;
    url?: string;
    email?: string;
  } | null;
  license: {
    name?: string;
    url?: string;
  } | null;
  readonly tags?: string[];
  readonly servers?: string[];
  readonly externalDocs?: string;
};

export class ServiceChunk extends Chunk<'service', ServiceData> {
  readonly #document: Record<string, unknown>;

  constructor(document: Record<string, unknown>, data: ServiceData) {
    super('service', data);
    this.#document = document;
  }

  override set<F extends keyof OmitReadonly<ServiceData>>(field: F, value: NonNullable<ServiceData[F]>) {
    super.set(field, value);
    switch (field) {
      case 'title':
      case 'description':
      case 'summary':
      case 'version':
      case 'contact':
      case 'license': {
        const info = unwrapOrElseForResult(tryInto(this.#document['info'], 'object'), () => {
          const v: Record<string, unknown> = {};
          this.#document['info'] = v;
          return v;
        });

        info[field] = value;
        break;
      }
      default:
        throw new Error(`Cannot set field ${field} on service`);
    }
  }

  override add(field: Exclude<string, keyof ServiceData>, _value: unknown) {
    throw new Error(`Cannot add field ${field} to service`);
  }
}

export function createServiceChunk(document: Record<string, unknown>, service: IBundledHttpService) {
  const data = {
    title: service.name,
    summary: service.summary ?? '',
    description: service.description ?? '',
    version: service.version,
    contact: service.contact
      ? {
          name: service.contact.name,
          email: service.contact.email,
          url: service.contact.url,
        }
      : null,
    license: service.license
      ? {
          name: service.license.name,
          url: service.license.url,
        }
      : null,
    servers: service.servers?.map(server => server.url),
    tags: service.tags?.map(tag => tag.name),
    externalDocs: service.externalDocs?.url,
  } satisfies ServiceData;

  return new ServiceChunk(document, data);
}
