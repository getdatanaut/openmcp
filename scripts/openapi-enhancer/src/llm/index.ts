import type OpenAI from 'openai';

import createSAXJsonPatchParser, { type ParseResult } from '../json-patch/parser.ts';
import { JSON_PATCH_SCHEMA } from './consts.ts';

/**
 * Calls the OpenAI LLM with a prompt
 * @param openai The OpenAI client to use
 * @param prompt The prompt to send to the LLM
 * @param model The model ID to use (defaults to gpt-4.1)
 * @returns The LLM's response text as a ReadableStream
 */
export default async function* callLLM(
  openai: OpenAI,
  prompt: string,
  model: string = 'gpt-4.1',
): AsyncIterable<ParseResult> {
  const stream = await openai.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    top_p: 0.8,
    stream: true,
    response_format: { type: 'json_schema', json_schema: JSON_PATCH_SCHEMA },
  });

  const parser = createSAXJsonPatchParser();

  for await (const chunk of stream) {
    if (chunk.choices.length === 0) continue;
    const choice = chunk.choices[0]!;
    const text = choice.delta.content;
    if (!text) continue;

    parser.write(text);
    for (const operation of parser) {
      yield operation;
    }
  }
}
