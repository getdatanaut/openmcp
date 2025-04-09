import type { Schema } from 'ai';
import type { z } from 'zod';

// aisdk does not export these, so copied over
export type ToolParameters = z.ZodTypeAny | Schema<any>;
export type inferToolParameters<Params extends ToolParameters> =
  Params extends Schema<any> ? Params['_type'] : Params extends z.ZodTypeAny ? z.infer<Params> : never;

export type ToolOutput = z.ZodTypeAny | Schema<any>;

export type ToolName = string;

export interface MpcServerTool<
  Params extends ToolParameters = any,
  ToolResult = any,
  OutputSchema extends ToolOutput = any,
> {
  parameters?: Params;
  description?: string;
  output?: OutputSchema;
  execute: (args: inferToolParameters<Params>) => Promise<ToolResult>;
}

export function tool<Params extends ToolParameters, ToolResult, OutputSchema extends ToolOutput>(
  tool: MpcServerTool<Params, ToolResult, OutputSchema>,
) {
  return tool;
}
