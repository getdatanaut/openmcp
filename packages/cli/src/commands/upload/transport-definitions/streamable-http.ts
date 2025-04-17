import {
  StreamableHTTPClientTransport,
  type StreamableHTTPClientTransportOptions,
} from '@modelcontextprotocol/sdk/client/streamableHttp.js';

import ConfigSchema from '../utils/config-schema.ts';
import maskHeaders from '../utils/mask-headers.ts';
import maskUrl from '../utils/mask-url.ts';
import type { TransportDefinition } from './types.ts';

export type StreamableHTTPTransportDefinition = TransportDefinition<'streamableHttp'>;

export default function createStreamableHTTPTransportDefinition(
  url: URL,
  opts: StreamableHTTPClientTransportOptions,
): StreamableHTTPTransportDefinition {
  const configSchema = new ConfigSchema();
  const maskedUrl = maskUrl(configSchema, url);
  const maskedHeaders = opts.requestInit?.headers
    ? maskHeaders(configSchema, new Headers(opts.requestInit.headers))
    : undefined;

  return {
    transport: new StreamableHTTPClientTransport(url, opts),
    transportConfig: {
      type: 'streamable-http',
      url: maskedUrl,
      headers: maskedHeaders,
    },
    configSchema: configSchema.serialize(),
    externalId: undefined,
  };
}
