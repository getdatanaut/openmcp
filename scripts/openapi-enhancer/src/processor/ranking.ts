import type { CoreMessage } from 'ai';

import { generateObject, loadPromptAndOutput } from '../llm/index.ts';
import prettyStringify from '../utils/pretty-stringify.ts';
import type { Context, Purpose } from './types.ts';

export default async function generateRanking(
  { model }: Context,
  messages: readonly CoreMessage[],
  purposes: Purpose[],
) {
  const { prompt, output } = await loadPromptAndOutput('rank', {
    purposes: purposes.map(purpose => purpose.value),
  });

  const purposeToId: Record<string, string> = {};
  for (const purpose of purposes) {
    purposeToId[purpose.value] = purpose.id;
  }

  const { list } = await generateObject(
    model,
    [...messages.filter(message => message.role === 'system'), { role: 'user', content: prompt }],
    output,
  );

  return list
    .map(elem => {
      const purposeId = purposeToId[elem.purpose];
      return {
        id: purposeId,
        ...elem,
      };
    })
    .sort((a, b) => b.score - a.score);
}
