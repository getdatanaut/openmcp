import { transformOas2Service } from '@stoplight/http-spec/oas2';
import { transformOas3Service } from '@stoplight/http-spec/oas3';

import loadDocument from './load-document.ts';

export type { IHttpService } from '@stoplight/types';

export default async function loadDocumentAsService(filepath: string) {
  const document = await loadDocument(filepath);
  if ('openapi' in document) {
    return transformOas3Service({ document });
  }

  return transformOas2Service({ document });
}
