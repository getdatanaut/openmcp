import type { Schema } from 'ai';
import type { z } from 'zod';

// aisdk does not export these, so copied over
export type ToolParameters = z.ZodTypeAny | Schema<any>;
export type inferToolParameters<Params extends ToolParameters> =
  Params extends Schema<any> ? Params['_type'] : Params extends z.ZodTypeAny ? z.infer<Params> : never;

export type ToolOutput = z.ZodTypeAny | Schema<any>;

export type ToolName = string;

export type ToolAnnotations<Hints extends Record<string, boolean> = Record<string, boolean>> = {
  title?: string;
  hints?: Hints;
};

export interface McpServerTool<
  Params extends ToolParameters = ToolParameters,
  ToolResult = any,
  OutputSchema extends ToolOutput = ToolOutput,
  Annotations extends ToolAnnotations = ToolAnnotations,
> {
  parameters?: Params;
  description?: string;
  output?: OutputSchema;
  execute: (args: inferToolParameters<Params>) => Promise<ToolResult>;
  annotations?: Annotations;
}

export function tool<
  Params extends ToolParameters,
  ToolResult,
  OutputSchema extends ToolOutput,
  Annotations extends ToolAnnotations,
>(tool: McpServerTool<Params, ToolResult, OutputSchema, Annotations>) {
  return tool;
}
