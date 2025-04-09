/**
 * Credit to supabase-mcp for the original implementation of these resource helpers
 * https://github.com/supabase-community/supabase-mcp/tree/main/packages/mcp-utils
 */

import { UriTemplate } from '@modelcontextprotocol/sdk/shared/uriTemplate.js';

export type ExtractParams<Path extends string> = Path extends `${string}{${infer P}}${infer Rest}`
  ? P | ExtractParams<Rest>
  : never;

export type Scheme = string;

export type ResourceUri = string;

export type Resource<Uri extends string = string, Result = unknown> = {
  uri: Uri;
  name: string;
  description?: string;
  mimeType?: string;
  read(uri: ResourceUri): Promise<Result>;
};

export type ResourceTemplate<Uri extends string = string, Result = unknown> = {
  uriTemplate: UriTemplate;
  name: string;
  description?: string;
  mimeType?: string;
  read(
    uri: ResourceUri,
    params: {
      [Param in ExtractParams<Uri>]: string;
    },
  ): Promise<Result>;
};

/**
 * Helper function to define an MCP resource while preserving type information.
 */
export function resource<Uri extends string, Result>(
  uri: Uri,
  resource: Omit<Resource<Uri, Result>, 'uri'>,
): Resource<Uri, Result> {
  return {
    uri,
    ...resource,
  };
}

/**
 * Helper function to define an MCP resource with a URI template while preserving type information.
 */
export function resourceTemplate<Uri extends string, Result>(
  uriTemplate: Uri,
  resource: Omit<ResourceTemplate<Uri, Result>, 'uriTemplate'>,
): ResourceTemplate<Uri, Result> {
  return {
    uriTemplate: new UriTemplate(uriTemplate),
    ...resource,
  };
}

/**
 * Helper function to define a JSON resource while preserving type information.
 */
export function jsonResource<Uri extends string, Result>(
  uri: Uri,
  resource: Omit<Resource<Uri, Result>, 'uri' | 'mimeType'>,
): Resource<Uri, Result> {
  return {
    uri,
    mimeType: 'application/json' as const,
    ...resource,
  };
}

/**
 * Helper function to define a JSON resource with a URI template while preserving type information.
 */
export function jsonResourceTemplate<Uri extends string, Result>(
  uriTemplate: Uri,
  resource: Omit<ResourceTemplate<Uri, Result>, 'uriTemplate' | 'mimeType'>,
): ResourceTemplate<Uri, Result> {
  return {
    uriTemplate: new UriTemplate(uriTemplate),
    mimeType: 'application/json' as const,
    ...resource,
  };
}

/**
 * Helper function to define a list of resources that share a common URI scheme.
 */
export function resources<Scheme extends string>(
  scheme: Scheme,
  resources: (Resource | ResourceTemplate)[],
): (Resource<`${Scheme}://${string}`> | ResourceTemplate<`${Scheme}://${string}`>)[] {
  return resources.map(resource => {
    if ('uri' in resource) {
      const url = new URL(resource.uri, `${scheme}://`);
      const uri = decodeURI(url.href) as `${Scheme}://${typeof resource.uri}`;

      return {
        ...resource,
        uri,
      };
    }

    const url = new URL(resource.uriTemplate.toString(), `${scheme}://`);

    return {
      ...resource,
      uriTemplate: new UriTemplate(decodeURI(url.href)),
    };
  });
}

/**
 * Helper function to create a JSON resource response.
 */
export function jsonResourceResponse<Uri extends string, Response>(uri: Uri, response: Response) {
  return {
    uri,
    mimeType: 'application/json',
    text: JSON.stringify(response),
  };
}
