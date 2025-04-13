import console from '@libs/console';
import { traverse } from '@stoplight/json';
import { type CoreMessage, generateObject, type LanguageModelV1 } from 'ai';
import dedent from 'dedent';
import { countTokens } from 'gpt-tokenizer/model/gpt-4o';
import type { JSONSchema7 } from 'json-schema';
import { batchExec, type Callback } from 'jsonpath-rfc9535';
import _set from 'lodash/set.js';
import { err, fromPromise, ok, type Result } from 'neverthrow';
import { z } from 'zod';

import * as errors from './errors.ts';

export type AutoTrimToolResultError = ProcessJsonPathsError | errors.AiSdk;

export async function autoTrimToolResult<T>({
  tool,
  toolResult,
  toolResultRequirements,
  model,
  minTokens,
  tokenRatioThreshold = 0.5,
}: {
  tool: { name: string; description?: string };
  toolResult: T;
  /** A description of what the tool results will be used for. */
  toolResultRequirements: string;
  model: LanguageModelV1;
  minTokens?: number;
  tokenRatioThreshold?: number;
}): Promise<Result<T, AutoTrimToolResultError>> {
  // We can only auto trim objects - return the original result if it's not an object
  if (!isRecord(toolResult)) {
    return ok(toolResult);
  }

  const stringifiedToolResult = JSON.stringify(toolResult);
  const resultTokenCount = countTokens(stringifiedToolResult);

  if (minTokens && resultTokenCount < minTokens) {
    console.log(
      `autoTrimToolResult(${tool.name}): result token count of ${resultTokenCount} is less than minTokens of ${minTokens}... skipping`,
    );

    return ok(toolResult);
  }

  // Create a trimmed version for the LLM prompt
  const trimmedResult = createTrimmedToolResult(toolResult);

  const messages = [
    {
      role: 'system',
      content: dedent`
        A request was just made to a tool named "${tool.name}". ${
          tool.description ? `This tool is described as "${tool.description}".` : ''
        }

        We need to use the tool's description, the user's message history, and the provided truncated tool output.

        The json path expression(s) that you generate will be used on the full tool output to extract the minimum data needed to answer the user's request.

        - The goal is to reduce the size of the response, while still being able to fulfill the user's request.
        - If you believe that the data retrieved from the primary json path may not be sufficient to answer the user's request, you can provide secondary json paths.
        - The JSON path that you provide MUST BE A VALID JSON PATH, following the RFC9535 standard, FOR THE GIVEN ABREVIATED TOOL OUTPUT.
        - IMPORTANT: Air on the side of simpler JSON path expressions if possible. It is better to use a simpler json path expression that results in a larger data set than to use a complex json path expression that might not work.
        - IMPORTANT: avoid using json path filter expressions like $.users[?(@.name == "John")].id, instead use $.users[*].id which is safer even if it retrieves more data. Use secondaryJsonPaths if you need multiple properties.
        - IMPORTANT: if any part of the json path expression includes a dash, you must quote it and wrap in brackets. For example, $.paintings[*].official-artwork.name is invalid but $.paintings[*]["official-artwork"].name is valid.

        <abbreviated_tool_output>
        ${JSON.stringify(trimmedResult)}
        </abbreviated_tool_output>
      `,
    },
    { role: 'user', content: toolResultRequirements },
  ] satisfies CoreMessage[];

  const jsonPathTokenCount = countTokens(messages);

  if (resultTokenCount / jsonPathTokenCount <= tokenRatioThreshold) {
    console.log(
      `autoTrimToolResult(${tool.name}): result token count of ${resultTokenCount} is less than ${tokenRatioThreshold} of json path processing token count of ${jsonPathTokenCount}... skipping`,
    );

    return ok(toolResult);
  }

  const generated = await fromPromise(
    // Generate JSON paths to extract relevant data
    generateObject({
      model,
      messages,
      schema: z.object({
        primaryJsonPath: z
          .string()
          .describe(
            'A json path that is valid for the tool output. For example: $.data.results[0].id, $.data.results[*].name, etc.',
          ),
        secondaryJsonPaths: z
          .array(z.string())
          .describe(
            "Optional secondary json paths that are valid for the tool output. Use this only if you believe that the data retrieved from the primary json path may not be sufficient to answer the user's request.",
          )
          .optional()
          .default([]),
      }),
    }),
    error => errors.handleAiSdkError({ error, model }),
  );

  if (generated.isErr()) {
    return err(generated.error);
  }

  const { object: toolOutputPaths, usage } = generated.value;

  // Process the JSON paths to extract relevant data
  const processedResultResult = processJsonPaths(toolResult, toolOutputPaths);

  if (processedResultResult.isErr()) {
    return err(processedResultResult.error);
  }

  const endingTokenCount = countTokens(JSON.stringify(processedResultResult.value));
  const tokenSavings = resultTokenCount - endingTokenCount - usage?.totalTokens;

  console.log(
    `autoTrimToolResult(${tool.name}): used ${usage?.totalTokens} tokens to reduce result token count by ${resultTokenCount - endingTokenCount} tokens (${(((resultTokenCount - endingTokenCount) / resultTokenCount) * 100).toFixed(2)}%), resulting in a total token savings of ${tokenSavings} tokens`,
  );

  return ok(processedResultResult.value);
}

/**
 * Adds a '__tool_result_requirements' property to a JSON schema if the schema describes an object
 *
 * This property is used to provide a short description of the current task to the tool.
 * This is used to trim the tool's result to just the information you need, so make sure to include any context the tool needs in order to understand what data to return to you.
 */
export function addToolRequirementsToSchema(schema?: JSONSchema7): JSONSchema7 | undefined {
  const props = {
    __tool_result_requirements: {
      type: 'string',
      description: dedent`
        A short description of your current task. This will be used to trim the tool's result to just the information you need, so make sure to include any context the tool needs in order to understand what data to return to you.

        If this is a mutation and you will not need any data from the tool result, set this to the string "SKIP".
      `,
    },
  } as const;

  if (!schema) {
    return {
      type: 'object',
      properties: props,
    };
  }

  // Only add messages property if schema describes an object
  if (schema && typeof schema === 'object' && schema.type === 'object') {
    return {
      ...schema,
      properties: {
        ...(schema.properties || {}),
        ...props,
      },
    };
  }

  // Return unchanged schema if not an object
  return schema;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

type ProcessJsonPathsError = errors.JsonPath;

// Processes JSON paths and extracts data from the tool result
function processJsonPaths<T extends Record<string, unknown>>(
  toolResultContent: T,
  toolOutputPaths: {
    primaryJsonPath: string;
    secondaryJsonPaths: string[];
  },
): Result<T, ProcessJsonPathsError> {
  const summarizedResult = {} as T;
  const jsonPathCallbacks = new Map<string, Callback>();

  const jsonPaths = [toolOutputPaths.primaryJsonPath, ...toolOutputPaths.secondaryJsonPaths];

  for (const jsonPath of jsonPaths) {
    if (!jsonPath) continue;

    jsonPathCallbacks.set(jsonPath, (value, path) => {
      _set(summarizedResult, path, value);
    });
  }

  const erroredPaths: string[] = [];

  try {
    batchExec(
      // @ts-expect-error ignore
      toolResultContent,
      jsonPathCallbacks,
      (_, path) => {
        erroredPaths.push(path);
      },
    );
  } catch (error) {
    console.error('processJsonPaths.error', { error, toolOutputPaths, toolResultContent });
    return err(errors.jsonPath({ paths: jsonPaths, error }));
  }

  if (erroredPaths.length) {
    console.warn('processJsonPaths.erroredPaths', { erroredPaths });
  }

  // If the primary json path errored, safest to fall back to returning the entire result
  if (erroredPaths.includes(toolOutputPaths.primaryJsonPath)) {
    return ok(toolResultContent);
  }

  return ok(Object.keys(summarizedResult).length ? summarizedResult : toolResultContent);
}

// Creates a trimmed version of the tool result for prompt construction, to reduce token usage
function createTrimmedToolResult<T>(toolResultContent: T): T {
  const trimmedResult = structuredClone(toolResultContent);

  traverse(trimmedResult, {
    onProperty: ({ parent, property, propertyValue }) => {
      if (Array.isArray(propertyValue)) {
        _set(parent, property, propertyValue.slice(0, 1));
      }
    },
  });

  return trimmedResult;
}
