import {
  OpenAPITransportSchema,
  SSETransportSchema,
  StdIOTransportSchema,
  StreamableHTTPTransportSchema,
  ToolName,
} from '@libs/schemas/mcp';
import { z } from 'zod';

export const ToolSchema = z.object({
  name: ToolName,
});

export type Tool = z.infer<typeof ToolSchema>;

const tools = z.array(ToolSchema).nonempty('Tools must be provided and non-empty');

export const OpenAPIServerSchema = OpenAPITransportSchema.extend({
  tools,
});

export type OpenAPIServer = z.infer<typeof OpenAPIServerSchema>;

export const StreamableHTTPServerSchema = StreamableHTTPTransportSchema.extend({
  tools,
});

export type StreamableHTTPServer = z.infer<typeof StreamableHTTPServerSchema>;

export const SSEServerSchema = SSETransportSchema.extend({
  tools,
});

export type SSEServer = z.infer<typeof SSEServerSchema>;

export const StdIOServerSchema = StdIOTransportSchema.extend({
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
