import type { ServerDefinition } from '../types.ts';
import parseCmd from '../utils/parse-cmd/index.ts';
import createOpenAPITransportDefinition from './openapi.ts';
import createSSETransportDefinition from './sse.ts';
import createStdioTransportDefinition from './stdio.ts';
import type { TransportDefinition, TransportType } from './types.ts';

export default async function createTransportDefinition(
  definition: ServerDefinition,
): Promise<TransportDefinition<TransportType>> {
  switch (definition.type) {
    case 'stdio':
      return createStdioTransportDefinition(parseCmd(definition.input), process.cwd());
    case 'sse':
      return createSSETransportDefinition(definition.url, {
        requestInit: {
          headers: new Headers(definition.headers),
        },
      });
    case 'streamable-http': {
      const { default: createStreamableHTTPTransportDefinition } = await import('./streamable-http.ts');
      return createStreamableHTTPTransportDefinition(definition.url, {
        requestInit: {
          headers: new Headers(definition.headers),
        },
      });
    }
    case 'openapi':
      return createOpenAPITransportDefinition(definition.uri, definition.serverUrl);
  }
}
