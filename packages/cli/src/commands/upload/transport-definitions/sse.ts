import { SSEClientTransport, type SSEClientTransportOptions } from '@modelcontextprotocol/sdk/client/sse.js';

import ConfigSchema from '../utils/config-schema.ts';
import maskHeaders from '../utils/mask-headers.ts';
import maskUrl from '../utils/mask-url.ts';
import type { TransportDefinition } from './types.ts';

export type SSETransportDefinition = TransportDefinition<'sse'>;

export default function createSSETransportDefinition(
  url: URL,
  opts: SSEClientTransportOptions,
): SSETransportDefinition {
  const configSchema = new ConfigSchema();
  const maskedUrl = maskUrl(configSchema, url);
  const maskedHeaders = opts.requestInit?.headers
    ? maskHeaders(configSchema, new Headers(opts.requestInit.headers))
    : undefined;

  return {
    transport: new SSEClientTransport(url, opts),
    transportConfig: {
      type: 'sse',
      url: maskedUrl,
      headers: maskedHeaders,
    },
    configSchema: configSchema.serialize(),
    externalId: undefined,
  };
}
