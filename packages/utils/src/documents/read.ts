type Document = {
  readonly content: string;
  readonly type: string;
};

export type IO = {
  fetch(url: URL): Promise<{
    readonly ok: boolean;
    readonly status: number;
    readonly statusText: string;
    readonly headers: {
      get(name: string): string | null;
    };
    text(): Promise<string>;
  }>;
  fs: {
    readFile(filepath: string, encoding: 'utf8'): Promise<string>;
  };
};

/**
 * Reads the content of a document from a specified location. The method determines
 * whether the location is a URL or a filesystem path and processes it accordingly.
 *
 * @param {IO} io - The IO object containing the necessary utilities like filesystem (fs) and fetch.
 * @param location - The location of the document. Can be a file path or a URL.
 * @return A promise that resolves as Document containing content (read content) and file type
 */
export default function readDocument(io: IO, location: string): Promise<Document> {
  let url: URL;
  try {
    url = new URL(location);
  } catch {
    // not a valid uri, let's try reading from filesystem
    return readFile(io.fs, location);
  }

  switch (url.protocol) {
    case 'file:':
      return readFile(io.fs, url.pathname);
    case 'http:':
    case 'https:':
      return readUrl(io.fetch, url);
    default:
      throw new Error(`Unsupported protocol: ${url.protocol}`);
  }
}

async function readFile(fs: IO['fs'], filepath: string): Promise<Document> {
  const content = await fs.readFile(filepath, 'utf8');
  return {
    content,
    type: extname(filepath).slice(1),
  };
}

async function readUrl(fetch: IO['fetch'], url: URL): Promise<Document> {
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

function extname(path: string) {
  const index = path.lastIndexOf('.');
  return index === -1 ? '' : path.slice(index);
}
