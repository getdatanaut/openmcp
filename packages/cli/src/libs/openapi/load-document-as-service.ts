import * as fs from 'node:fs/promises';

import { loadDocument } from '@openmcp/utils/documents';
import { transformOas2Service } from '@stoplight/http-spec/oas2';
import { transformOas3Service } from '@stoplight/http-spec/oas3';

export type { IHttpService } from '@stoplight/types';

export default async function loadDocumentAsService(location: string) {
  const document = await loadDocument(
    {
      fetch,
      fs,
    },
    location,
  );
  if ('openapi' in document) {
    return transformOas3Service({ document });
  }

  return transformOas2Service({ document });
}
