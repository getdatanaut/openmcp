import { z } from 'zod';

export const OpenAPITransportSchema = z.object({
  type: z.literal('openapi'),
  serverConfig: z.object({
    openapi: z.string().url(),
    serverUrl: z.string().url(),
  }),
  clientConfig: z
    .object({
      path: z.record(z.unknown()).optional(),
      query: z.record(z.unknown()).optional(),
      headers: z.record(z.unknown()).optional(),
      body: z.record(z.unknown()).optional(),
    })
    .optional(),
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
});

export type StdIOTransport = z.infer<typeof StdIOTransportSchema>;

export const TransportSchema = z.discriminatedUnion('type', [
  StreamableHTTPTransportSchema,
  SSETransportSchema,
  OpenAPITransportSchema,
  StdIOTransportSchema,
]);

export type Transport = z.infer<typeof TransportSchema>;

export const McpClientConfigSchemaSchema = z.object({
  type: z.literal('object').optional(),
  properties: z
    .record(
      z.object({
        type: z.enum(['string', 'number', 'boolean']),
        title: z.string().optional(),
        description: z.string().optional(),
        default: z.union([z.string(), z.number(), z.boolean()]).optional(),
        enum: z.array(z.string()).optional(),
        format: z.union([z.literal('secret'), z.string()]).optional(),
        example: z.union([z.string(), z.number(), z.boolean()]).optional(),
      }),
    )
    .optional(),
  required: z.array(z.string()).optional(),
});

export const ToolInputSchemaSchema = z
  .object({
    type: z.literal('object').optional(),
    properties: z.optional(z.object({}).passthrough()),
  })
  .passthrough();

export const ToolOutputSchemaSchema = z
  .object({
    type: z.string().optional(),
    properties: z.optional(z.object({}).passthrough()),
  })
  .passthrough();
