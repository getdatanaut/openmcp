import * as fs from 'node:fs/promises';
import * as path from 'node:path';

type PromptCache = {
  role: string | null;
  ranking: string | null;
};

const promptCache: PromptCache = {
  role: null,
  ranking: null,
};

/**
 * Loads a prompt from a file
 * @param promptType The type of prompt to load
 * @returns The prompt text
 */
export async function loadPrompt(promptType: keyof PromptCache): Promise<string> {
  const existingValue = promptCache[promptType];
  if (existingValue !== null) {
    return existingValue;
  }

  try {
    const promptPath = path.join(import.meta.dirname, `${promptType}.prompt`);
    promptCache[promptType] = await fs.readFile(promptPath, 'utf-8');
    return promptCache[promptType];
  } catch (error) {
    throw new Error(`Could not load ${promptType}.prompt file: ${String(error)}`);
  }
}

/**
 * Loads the role prompt from the file
 * @returns The role prompt text
 */
export async function loadRolePrompt({ document }: Record<'document', string>): Promise<string> {
  return (await loadPrompt('role')).replace('{document}', document);
}
