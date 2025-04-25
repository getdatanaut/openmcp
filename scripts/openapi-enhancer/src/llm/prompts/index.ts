import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import ObjectSchema from './object.schema.ts';
import RankSchema from './rank.schema.ts';

const PROMPT_TO_OUTPUT = {
  role: null,
  rank: RankSchema,
  object: ObjectSchema,
};

type Prompts = {
  [key in keyof typeof PROMPT_TO_OUTPUT]: (typeof PROMPT_TO_OUTPUT)[key];
};

type PromptName = keyof Prompts;

const promptCache: Partial<Record<keyof Prompts, string>> = {};

export async function loadPromptAndOutput<N extends keyof Prompts>(name: N, values: Record<string, string>) {
  const prompt = await loadPrompt(name, values);
  const output = PROMPT_TO_OUTPUT[name];
  return { prompt, output } as const;
}

/**
 * Loads a prompt from a file
 * @param name The type of prompt to load
 * @param values The values to replace in the prompt
 * @returns The prompt text
 */
export async function loadPrompt(name: PromptName, values: Record<string, string>): Promise<string> {
  const existingValue = promptCache[name];
  if (existingValue !== undefined) {
    return replacePlaceholders(existingValue, values);
  }

  try {
    const promptPath = path.join(import.meta.dirname, `${name}.prompt`);
    promptCache[name] = await fs.readFile(promptPath, 'utf8');
    return replacePlaceholders(promptCache[name], values);
  } catch (error) {
    throw new Error(`Could not load ${name}.prompt file: ${String(error)}`);
  }
}

function replacePlaceholders(text: string, values: Record<string, string>): string {
  return text.replace(/\{\{(.*?)}}/g, (_, key) => values[key] ?? '');
}
