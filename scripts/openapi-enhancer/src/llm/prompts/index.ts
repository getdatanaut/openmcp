import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import type { z } from 'zod';

import prettyStringify from '../../utils/pretty-stringify.ts';
import * as ObjectSchema from './object.schema.ts';
import * as RankSchema from './rank.schema.ts';
import * as RoleSchema from './role.schema.ts';

const PROMPT_TO_SCHEMA = {
  role: RoleSchema,
  rank: RankSchema,
  object: ObjectSchema,
};

type Prompts = {
  [key in keyof typeof PROMPT_TO_SCHEMA]: (typeof PROMPT_TO_SCHEMA)[key];
};

type PromptName = keyof Prompts;

type PromptInput<N extends PromptName> = z.infer<Prompts[N]['input']>;
type PromptOutput<N extends PromptName> = Prompts[N]['output'];

const promptCache: Partial<Record<keyof Prompts, string>> = {};

export async function loadPromptAndOutput<N extends PromptName>(
  name: N,
  values: PromptInput<N>,
): Promise<{ readonly prompt: string; readonly output: PromptOutput<N> }> {
  const prompt = await loadPrompt(name, values);
  const output = PROMPT_TO_SCHEMA[name].output;
  return { prompt, output };
}

/**
 * Loads a prompt from a file
 * @param name The type of prompt to load
 * @param values The values to replace in the prompt
 * @returns The prompt text
 */
export async function loadPrompt<N extends PromptName>(name: N, values: PromptInput<N>): Promise<string> {
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

function replacePlaceholders(text: string, values: Record<string, unknown>): string {
  return text.replace(/\{\{(.*?)}}/g, (str, key) => {
    if (!Object.hasOwn(values, key)) {
      return str;
    }

    const value = values[key];
    return prettyStringify(value);
  });
}
