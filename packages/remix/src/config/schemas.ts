import { z } from 'zod';

export const ToolSchema = z.object({
  // todo: impose regex and length validation
  name: z.string(),
});

export type Tool = z.infer<typeof ToolSchema>;

const tools = z.array(ToolSchema).nonempty('Tools must be provided and non-empty');

export const OpenAPIServerSchema = z.object({
  type: z.literal('openapi'),
  serverConfig: z.object({
    openapi: z.union([z.record(z.unknown()), z.string().url()]),
    serverUrl: z.string().url(),
  }),
  clientConfig: z
    .object({
      headers: z.record(z.union([z.array(z.string()), z.string()])).optional(),
    })
    .optional(),
  tools,
});

export type OpenAPIServer = z.infer<typeof OpenAPIServerSchema>;

export const SSEServerSchema = z.object({
  type: z.literal('sse'),
  url: z.string().url(),
  headers: z
    .object({
      'x-openmcp': z.string(),
    })
    .optional(),
  tools,
});

export type SSEServer = z.infer<typeof SSEServerSchema>;

export const StdIOServerSchema = z.object({
  type: z.literal('stdio'),
  command: z.string().nonempty('Command must be provided'),
  args: z.array(z.string()),
  tools,
});

export type StdIOServer = z.infer<typeof StdIOServerSchema>;

export const RemixServerSchema = z.discriminatedUnion('type', [
  SSEServerSchema,
  OpenAPIServerSchema,
  StdIOServerSchema,
]);

export type RemixServer = z.infer<typeof RemixServerSchema>;

export const ConfigSchema = z.object({
  configs: z.record(z.record(z.unknown())),
  servers: z.record(RemixServerSchema),
});

export type Config = z.infer<typeof ConfigSchema>;
