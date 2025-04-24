import {
  type OpenAPIV2,
  type OpenAPIV3,
  type OpenAPIV3_1,
  PathsObject,
  SecurityRequirementObject,
  ServerObject,
  TagObject,
} from 'openapi-types';
import { isOk } from 'option-t/plain_result';

import { tryInto, tryIntoString } from '../utils/accessors.ts';

/**
 * Removes redundant / custom properties from an OpenAPI document.
 * @param document
 */
export default function cleanDocument(document: Record<string, unknown>): Record<string, unknown> {
  const openapiVersion = tryIntoString(document['openapi'], 'string');
  if (isOk(openapiVersion)) {
    return processV3(document);
  }
}

function processV2(doc: OpenAPIV2.Document) {}

function processV3(document: OpenAPIV3.Document | OpenAPIV3_1.Document) {
  // openapi: string;
  // info: InfoObject;
  // servers?: ServerObject[];
  // paths: PathsObject<T>;
  // components?: ComponentsObject;
  // security?: SecurityRequirementObject[];
  // tags?: TagObject[];
  // externalDocs?: ExternalDocumentationObject;
  cleanInfo(document.info);
}

function cleanInfo(info: OpenAPIV3_1.InfoObject) {}
