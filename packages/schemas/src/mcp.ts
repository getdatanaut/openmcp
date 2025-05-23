import isValidPath from 'is-valid-path';
import { z } from 'zod';

export const ToolName = z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/, 'Tool name must match /^[a-zA-Z0-9_-]{1,64}$/');

export const OpenAPITransportSchema = z.object({
  type: z.literal('openapi'),
  openapi: z.string().refine(
    value => {
      return URL.canParse(value) || isValidPath(value);
    },
    {
      message: 'openapi must be a valid URL or file path',
    },
  ),
  serverUrl: z.string().url().optional(),
  path: z.record(z.unknown()).optional(),
  query: z.record(z.unknown()).optional(),
  headers: z.record(z.unknown()).optional(),
  body: z.record(z.unknown()).optional(),
});

export type OpenAPITransport = z.infer<typeof OpenAPITransportSchema>;

export const StreamableHTTPTransportSchema = z.object({
  type: z.literal('streamable-http'),
  url: z.string().url(),
  headers: z.record(z.string()).optional(),
});

export type StreamableHTTPTransport = z.infer<typeof StreamableHTTPTransportSchema>;

export const SSETransportSchema = z.object({
  type: z.literal('sse'),
  url: z.string().url(),
  headers: z.record(z.string()).optional(),
});

export type SSETransport = z.infer<typeof SSETransportSchema>;

export const StdIOTransportSchema = z.object({
  type: z.literal('stdio'),
  command: z.string().nonempty('Command must be provided'),
  args: z.array(z.string()),
  env: z.record(z.string()).optional(),
  cwd: z.string().optional(),
});

export type StdIOTransport = z.infer<typeof StdIOTransportSchema>;

export const TransportSchema = z.discriminatedUnion('type', [
  StreamableHTTPTransportSchema,
  SSETransportSchema,
  OpenAPITransportSchema,
  StdIOTransportSchema,
]);

export type Transport = z.infer<typeof TransportSchema>;
