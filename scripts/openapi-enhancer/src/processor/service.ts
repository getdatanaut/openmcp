import type { CoreMessage } from 'ai';

import { loadPrompt } from '../llm/index.ts';
import type { ServiceChunk } from '../openapi';

export default async function processService(messages: CoreMessage[], object: ServiceChunk): Promise<void> {
  messages.push({
    role: 'system',
    content: await loadPrompt('role', {
      document: object.data,
    }),
  });
}
