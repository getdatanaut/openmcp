import { isPlainObject } from '@stoplight/json';
import { HttpParamStyles, type IHttpOperation, type IHttpPathParam, type IHttpQueryParam } from '@stoplight/types';
import escapeRegExp from 'lodash-es/escapeRegExp.js';
import { parseTemplate, type PrimitiveValue, type Template } from 'url-template';

type QueryParamMeta = {
  style: IHttpQueryParam['style'];
  // When this is true, parameter values of type array or object generate separate parameters for each value of the array or key-value pair of the map.
  // For other types of parameters this property has no effect.
  // When style equals `form`, the default value is true. For all other styles, the default value is false.
  explode?: boolean;
};

export type OperationClientMeta = {
  readonly path: string;
  readonly method: Uppercase<string>;
  readonly requestContentType?: string;
  readonly params?: {
    readonly query?: Readonly<Record<string, QueryParamMeta>>;
  };
};

export type RequestInit = {
  path?: Record<string, unknown>;
  headers?: Record<string, unknown>;
  query?: Record<string, unknown>;
  body?: unknown;
  signal?: AbortSignal;
};

export type FetchImpl = (
  url: URL,
  init: {
    method: string;
    headers: HeadersInit;
    body: BodyInit | undefined;
    signal?: AbortSignal;
  },
) => Promise<{
  ok: boolean;
  status: number;
  statusText: string;
  body: ReadableStream<Uint8Array> | null;
  headers: Headers;
  arrayBuffer: () => Promise<ArrayBuffer>;
  text: () => Promise<string>;
  json: () => Promise<unknown>;
}>;

export type ClientConfig = {
  fetch?: FetchImpl;
  requestHeaders?: Record<string, string>;
  defaultRequestTimeout?: number;
};

const DEFAULT_ACCEPT_HEADER = 'application/json, text/*;q=0.9, */*;q=0.8';
const DEFAULT_REQUEST_HEADERS = {
  Accept: DEFAULT_ACCEPT_HEADER,
  'Content-Type': 'application/json',
};

export class Client {
  readonly #baseURL: URL;
  readonly #fetch: FetchImpl;
  readonly #defaultRequestHeaders: Record<string, string>;
  readonly #defaultRequestTimeout: number;

  constructor(baseURL: URL, { fetch: _fetch = fetch, requestHeaders, defaultRequestTimeout }: ClientConfig = {}) {
    this.#baseURL = baseURL;
    this.#fetch = _fetch;
    this.#defaultRequestHeaders = {
      ...DEFAULT_REQUEST_HEADERS,
      ...requestHeaders,
    };
    this.#defaultRequestTimeout = Math.max(0, defaultRequestTimeout ?? 0);
  }

  #createHeaders(meta: OperationClientMeta) {
    const headers = new Headers(this.#defaultRequestHeaders);
    if (meta.requestContentType) {
      const requestContentType = isTextContentType(meta.requestContentType)
        ? `${meta.requestContentType}; charset=utf-8`
        : meta.requestContentType;

      headers.set('Content-Type', requestContentType);
    }

    return headers;
  }

  /**
   * Creates a timed controller that triggers an abort after the specified timeout.
   *
   * @param timeout - The timeout value in milliseconds after which the signal will be aborted.
   * @return A disposable object containing the abort signal and an abort function.
   */
  static createTimedController(timeout: number) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    return {
      signal: controller.signal,
      abort() {
        clearTimeout(id);
        controller.abort();
      },
      [Symbol.dispose]() {
        clearTimeout(id);
      },
    };
  }

  /**
   * Creates and returns a `FetchRequestInit` object, including the URL and options required for a fetch request.
   *
   * @param meta - Metadata describing the operation, such as HTTP method, path, and query parameter styles.
   * @param requestInit - The request initialization object, containing path parameters, request body, headers, and query parameters.
   * @return Returns a tuple where the first element is the constructed URL
   *         and the second element is the options object for the fetch request, including method, headers, and optionally a formatted request body.
   */
  createFetchRequestInit(meta: OperationClientMeta, requestInit: RequestInit) {
    const { path: pathParams, body, query } = requestInit;
    const path = isPlainObject(pathParams) ? expandPath(parseTemplate(meta.path), pathParams) : meta.path;
    const url = new URL(this.#baseURL.pathname === '/' ? path : this.#baseURL.pathname + path, this.#baseURL);

    if (isPlainObject(query)) {
      for (const [name, value] of Object.entries(query)) {
        const queryParamMeta = meta.params?.query?.[name] ?? { style: HttpParamStyles.Unspecified };
        addQueryParam(url.searchParams, name, value, queryParamMeta);
      }
    }

    const headers = this.#createHeaders(meta);
    if (isPlainObject(requestInit.headers)) {
      addHeaders(headers, requestInit.headers);
    }

    const requestContentType = parseContentTypeValue(headers.get('Content-Type'));

    return [
      url,
      {
        method: meta.method,
        headers,
        body: requestContentType !== null && isPlainObject(body) ? formatBody(body, requestContentType) : undefined,
      },
    ] as const;
  }

  /**
   * Sends an HTTP request to the specified endpoint, processes the response, and determines its format. Supports optional signal.
   * @param meta - Metadata for the operation, including endpoint path, method, and request content type.
   * @param requestInit - Additional parameters for the request.
   * @param requestInit.body - The payload of the request, typically for POST or PUT requests.
   * @param requestInit.headers - Headers to include in the HTTP request.
   * @param requestInit.path - Path parameters to replace in the URL path template.
   * @param requestInit.query - Query parameters to append to the URL.
   * @param requestInit.signal - Request-specific signal. Overrides default request timeout.
   * @return The response data in its appropriate format (text, JSON, or binary).
   */
  async request(meta: OperationClientMeta, requestInit: RequestInit) {
    const [url, init] = this.createFetchRequestInit(meta, requestInit);
    if (requestInit.signal) {
      return processResponse(
        await this.#fetch(url, {
          ...init,
          signal: requestInit.signal,
        }),
      );
    } else if (this.#defaultRequestTimeout > 0) {
      using controller = Client.createTimedController(this.#defaultRequestTimeout);
      return processResponse(
        await this.#fetch(url, {
          ...init,
          signal: controller.signal,
        }),
      );
    } else {
      return processResponse(await this.#fetch(url, init));
    }
  }
}

function processResponse(res: Awaited<ReturnType<FetchImpl>>) {
  if (res.body === null) {
    return null;
  }

  const contentType = parseContentTypeValue(res.headers.get('content-type'));
  if (contentType === null) {
    return res.arrayBuffer();
  } else if (contentType.startsWith('text/')) {
    return res.text();
  } else if (isJsonContentType(contentType)) {
    return res.json();
  } else {
    return res.arrayBuffer();
  }
}

function expandPath(template: Template, params: Record<string, unknown>) {
  const formedParams: Record<string, PrimitiveValue | PrimitiveValue[]> = {};
  for (const [name, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      formedParams[name] = value.map(toPrimitiveValue);
    } else {
      formedParams[name] = toPrimitiveValue(value);
    }
  }

  return template.expand(formedParams);
}

// we do not support allowEmptyValue which is deprecated
function addQueryParam(searchParams: URLSearchParams, name: string, value: unknown, meta: QueryParamMeta) {
  const style = meta.style === HttpParamStyles.Unspecified ? HttpParamStyles.Form : meta.style;
  const explode = meta.explode ?? style === HttpParamStyles.Form;

  if (value === undefined) {
    return;
  }

  switch (style) {
    case HttpParamStyles.Form:
      if (Array.isArray(value)) {
        handleArrayFormParam(searchParams, name, value, explode);
      } else if (isPlainObject(value)) {
        handleObjectFormParam(searchParams, name, value, explode);
      } else {
        searchParams.set(name, String(toPrimitiveValue(value)));
      }
      break;
    case HttpParamStyles.SpaceDelimited:
      searchParams.set(name, joinDelimited(value, ' '));
      break;

    case HttpParamStyles.PipeDelimited:
      searchParams.set(name, joinDelimited(value, '|'));
      break;

    case HttpParamStyles.CommaDelimited:
      searchParams.set(name, joinDelimited(value, ','));
      break;

    case HttpParamStyles.TabDelimited:
      searchParams.set(name, joinDelimited(value, '\t'));
      break;

    case HttpParamStyles.DeepObject:
      if (!isPlainObject(value)) break;
      // only objects are valid
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        searchParams.set(`${name}[${k}]`, String(toPrimitiveValue(v)));
      }
      break;
  }
}

function handleArrayFormParam(searchParams: URLSearchParams, name: string, value: unknown[], explode: boolean) {
  if (explode) {
    for (const v of value) {
      searchParams.append(name, String(toPrimitiveValue(v)));
    }
  } else {
    searchParams.set(name, value.map(toPrimitiveValue).join(','));
  }
}

function handleObjectFormParam(
  searchParams: URLSearchParams,
  name: string,
  value: Record<string, unknown>,
  explode: boolean,
) {
  if (explode) {
    for (const [k, v] of Object.entries(value)) {
      searchParams.append(k, String(toPrimitiveValue(v)));
    }
  } else {
    searchParams.set(
      name,
      Object.entries(value)
        .map(([k, v]) => `${k},${toPrimitiveValue(v)}`)
        .join(','),
    );
  }
}

function joinDelimited(value: unknown, delimiter: string): string {
  if (Array.isArray(value)) {
    return value.map(toPrimitiveValue).join(delimiter);
  } else {
    return String(toPrimitiveValue(value));
  }
}

function addHeaders(headers: Headers, init: Record<string, unknown>): void {
  for (const [name, value] of Object.entries(init)) {
    if (Array.isArray(value)) {
      for (const elem of value) {
        headers.append(name, String(elem));
      }
    } else {
      headers.set(name, String(value));
    }
  }
}

/**
 * Format body based on the content type
 */
function formatBody(body: unknown, contentType: string) {
  switch (contentType) {
    case 'application/json':
      return JSON.stringify(body);
    case 'application/x-www-form-urlencoded': {
      if (isPlainObject(body)) {
        // URL encoded format
        const formData = new URLSearchParams();
        for (const [key, value] of Object.entries(body)) {
          formData.append(key, String(value));
        }
        return formData.toString();
      }

      break;
    }
    case 'multipart/form-data': {
      if (isPlainObject(body)) {
        // Multipart form data
        const formData = new FormData();
        for (const [key, value] of Object.entries(body)) {
          if (globalThis.Blob && value instanceof globalThis.Blob) {
            formData.append(key, value);
          } else {
            formData.append(key, String(toPrimitiveValue(value)));
          }
        }
        return formData;
      }

      break;
    }
    case 'text/plain':
      return typeof body === 'string' ? body : JSON.stringify(body);
    default:
      return JSON.stringify(body);
  }
}

/**
 * Collects and processes metadata for a given HTTP operation, returning structured information
 * about the path, method, content type, and query parameters.
 *
 * @param operation - The HTTP operation object containing request information, method, and path.
 * @return An object containing metadata about the operation, including path, method, request content type, and optional query parameters.
 */
export function collectOperationClientMeta(operation: Pick<IHttpOperation<false>, 'request' | 'method' | 'path'>) {
  const requestContentType = operation.request?.body?.contents?.[0]?.mediaType;
  const collectedQueryParams = operation.request?.query?.length
    ? collectQueryParamsMeta(operation.request.query)
    : null;
  const pathParams = operation.request?.path ?? null;
  const meta: OperationClientMeta = {
    path: pathParams === null || pathParams.length === 0 ? operation.path : pathToRFC6570(operation.path, pathParams),
    method: operation.method.toUpperCase() as Uppercase<typeof operation.method>,
    requestContentType,
    params:
      collectedQueryParams === null
        ? undefined
        : {
            query: collectedQueryParams,
          },
  };

  return meta;
}

/**
 * Converts the given path parameters in an operation to comply with the RFC 6570 URI template specification.
 * The function updates the path string to correctly reflect the parameter expansions based on their styles.
 * It handles Label-style and Matrix-style parameters while ignoring Simple-style parameters since they are presumed
 * to be managed by the library implementing the URL template.
 * The function does not support "explode", as it's not a common combination for path params
 * since explode defaults to `false` for other styles than Form
 * and path params do not support form style.
 *
 * @param path - path to replace template vars with valid RFC6570 expressions
 * @param params - http path params
 * @return {string} Updated `path with RFC 6570-compliant parameter expansions.
 */
function pathToRFC6570(path: string, params: IHttpPathParam[]): string {
  for (const param of params) {
    const style = param.style === HttpParamStyles.Unspecified ? HttpParamStyles.Simple : param.style;
    if (style === HttpParamStyles.Simple) {
      // simple string expansion https://datatracker.ietf.org/doc/html/rfc6570#section-3.2.2
      // we'll leave it to the url template lib to expand them
      continue;
    }

    const nameRegex = RegExp('{' + escapeRegExp(param.name) + '}', 'g');
    switch (style) {
      case HttpParamStyles.Label:
        // Label-style parameters defined by https://datatracker.ietf.org/doc/html/rfc6570#section-3.2.5
        // Replace {param} with {.param}
        path = path.replace(nameRegex, `{.${param.name}}`);
        break;
      case HttpParamStyles.Matrix:
        // Path-style parameters defined by https://datatracker.ietf.org/doc/html/rfc6570#section-3.2.7
        // Replace {param} with {;param}
        path = path.replace(nameRegex, `{;${param.name}}`);
        break;
    }
  }

  return path;
}

function collectQueryParamsMeta(query: IHttpQueryParam[]): Record<string, QueryParamMeta> {
  const meta: Record<string, QueryParamMeta> = {};
  for (const param of query) {
    meta[param.name] = {
      style: param.style,
      explode: param.explode,
    };
  }

  return meta;
}

function parseContentTypeValue(value: string | null | undefined): string | null {
  if (typeof value !== 'string' || value.length === 0) {
    return null;
  }

  const semicolonIndex = value.indexOf(';');
  return (semicolonIndex === -1 ? value : value.slice(0, semicolonIndex)).toLowerCase().trim();
}

function isJsonContentType(value: string) {
  return value === 'application/json' || extractVendorSpecificTextType(value) === 'json';
}

/**
 * Extracts the vendor-specific text subtype from a MIME type string.
 * Example of such vendor extension: application/vnd.github+json
 *
 * @param {string} value - The MIME type string to analyze.
 * @return {string | null} The extracted subtype if present and matches (json, xml, yaml, text), or null if not found.
 */
function extractVendorSpecificTextType(value: string): string | null {
  if (!value.startsWith('application/vnd.')) return null;

  const type = /\+(json|xml|yaml|text)$/.exec(value);
  return type === null ? null : type[1]!;
}

function isTextContentType(value: string): boolean {
  if (value.startsWith('text/')) return true;

  const commonTextBasedTypes = [
    'application/json',
    'application/ld+json',
    'application/x-json',
    'application/xml',
    'application/x-yaml',
    'application/yaml',
    'application/x-www-form-urlencoded',
  ];

  if (commonTextBasedTypes.includes(value)) return true;

  return extractVendorSpecificTextType(value) !== null;
}

function toPrimitiveValue(value: unknown): PrimitiveValue {
  if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean' || value === null) {
    return value;
  } else {
    try {
      return JSON.stringify(value);
    } catch {
      return '';
    }
  }
}
