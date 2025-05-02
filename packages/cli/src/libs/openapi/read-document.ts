import * as fs from 'node:fs/promises';
import { extname } from 'node:path';

type Document = {
  readonly content: string;
  readonly type: string;
};

export default function readDocument(location: string) {
  let url: URL;
  try {
    url = new URL(location);
  } catch {
    // not a valid uri, let's try reading from filesystem
    return readFile(location);
  }

  switch (url.protocol) {
    case 'file:':
      return readFile(url.pathname);
    case 'http:':
    case 'https:':
      return readUrl(url);
    default:
      throw new Error(`Unsupported protocol: ${url.protocol}`);
  }
}

async function readFile(filepath: string): Promise<Document> {
  const content = await fs.readFile(filepath, 'utf8');
  return {
    content,
    type: extname(filepath).slice(1),
  };
}

async function readUrl(url: URL): Promise<Document> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.statusText}`);
  }

  const content = await res.text();
  const contentType = res.headers.get('Content-Type');
  switch (contentType === null ? '' : parseContentType(contentType)) {
    case 'application/json':
    case 'text/json':
      return {
        content,
        type: 'json',
      };
    case 'application/yaml':
    case 'application/x-yaml':
    case 'text/yaml':
    case 'text/x-yaml':
      return {
        content,
        type: 'yaml',
      };
    default:
      return {
        content,
        type: extname(url.pathname).slice(1),
      };
  }
}

function parseContentType(contentType: string) {
  const index = contentType.indexOf(';');
  return index === -1 ? contentType : contentType.slice(0, index);
}
