import { type CoreMessage, generateObject as _generateObject, type LanguageModel } from 'ai';
import type { z } from 'zod';

export { loadPrompt, loadPromptAndOutput } from './prompts/index.ts';

export async function generateObject<O>(
  model: LanguageModel,
  messages: CoreMessage[],
  schema: z.Schema<O>,
): Promise<O> {
  const res = await _generateObject({
    model,
    messages,
    temperature: 0.7,
    topP: 0.8,
    output: 'object',
    schema,
  });

  return res.object;
}
