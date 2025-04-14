import { z } from 'zod';

export const ToolName = z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/, 'Tool name must match /^[a-zA-Z0-9_-]{1,64}$/');

export const ToolSchema = z.object({
  name: ToolName,
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
      path: z.record(z.unknown()).optional(),
      query: z.record(z.unknown()).optional(),
      headers: z.record(z.unknown()).optional(),
      body: z.record(z.unknown()).optional(),
    })
    .optional(),
  tools,
});

export type OpenAPIServer = z.infer<typeof OpenAPIServerSchema>;

export const StreamableHTTPServerSchema = z.object({
  type: z.literal('streamable-http'),
  url: z.string().url(),
  headers: z
    .object({
      'x-openmcp': z.string(),
    })
    .optional(),
  tools,
});

export type StreamableHTTPServer = z.infer<typeof StreamableHTTPServerSchema>;

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
  StreamableHTTPServerSchema,
  SSEServerSchema,
  OpenAPIServerSchema,
  StdIOServerSchema,
]);

export type RemixServer = z.infer<typeof RemixServerSchema>;

// slightly more restrictive than tool name to keep some buffer for the tool name
// we also disallow underscore `_` since we use it as a delimiter in the tool name
const RemixServerName = z.string().regex(/^[a-zA-Z0-9_]{1,24}$/, 'Server name must match ^[a-zA-Z0-9_]{1,24}$');

export const ConfigSchema = z
  .object({
    configs: z.record(z.record(z.unknown())),
    servers: z
      .record(RemixServerSchema)
      .refine(obj => Object.keys(obj).every(key => RemixServerName.safeParse(key).success), {
        message: 'Server names must match ^[a-zA-Z0-9_]{1,24}$',
      }),
  })
  .superRefine((data, ctx) => {
    for (const key of Object.keys(data.configs)) {
      if (!Object.hasOwn(data.servers, key)) {
        ctx.addIssue({
          code: 'custom',
          path: ['configs', key],
          message: `Config key "${key}" does not exist in servers`,
        });
      }
    }
  });

export type Config = z.infer<typeof ConfigSchema>;
