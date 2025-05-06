import * as fs from 'node:fs/promises';

import { loadDocument } from '@openmcp/utils/documents';
import { bundleOas2Service } from '@stoplight/http-spec/oas2';
import { bundleOas3Service } from '@stoplight/http-spec/oas3';

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
    return bundleOas3Service({ document });
  }

  return bundleOas2Service({ document });
}
