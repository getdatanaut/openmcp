import * as fs from 'node:fs/promises';

import { loadDocument } from '@openmcp/utils/documents';

import { transformOasService } from './http-spec.ts';

export type { IHttpService } from '@stoplight/types';

export default async function loadDocumentAsService(location: string) {
  const document = await loadDocument(
    {
      fetch,
      fs,
    },
    location,
  );

  return transformOasService(document);
}
