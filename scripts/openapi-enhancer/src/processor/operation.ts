import type { CoreMessage } from 'ai';

import { generateObject, loadPromptAndOutput } from '../llm/index.ts';
import type { OperationChunk } from '../openapi';
import prettyStringify from '../utils/pretty-stringify.ts';
import WritableLog from '../utils/writable-log.ts';
import type { Context, Purpose } from './types.ts';

export default function createObjectProcessor({ model, log }: Context, purposes: Purpose[]) {
  const logIndentation = WritableLog.getDefaultIndentation('info');

  return async (messages: CoreMessage[], operation: OperationChunk) => {
    log.write('info', `Processing ${operation.id}`);

    operation.events.on('add', (key, value) => {
      log.write('info', `added ${JSON.stringify(key)}`);
      log.writeRaw(WritableLog.indentString(`new value: ${JSON.stringify(value)}`, logIndentation));
      log.writeRaw('\n');
    });

    operation.events.on('change', (key, prev, value) => {
      log.write('info', `changed ${JSON.stringify(key)}`);
      log.writeRaw(WritableLog.indentString(`prev value: ${JSON.stringify(prev)}`, logIndentation));
      log.writeRaw('\n');
      log.writeRaw(WritableLog.indentString(`new value: ${JSON.stringify(value)}`, logIndentation));
      log.writeRaw('\n');
    });

    const { prompt: content, output } = await loadPromptAndOutput('object', {
      object: operation.toString(),
    });

    messages.push({ role: 'user', content });
    const response = await generateObject(model, messages, output);
    for (const key of Object.keys(response)) {
      switch (key) {
        case 'description':
        case 'summary':
          operation.set(key, response[key]);
          break;
        case 'tool-name':
        case 'tool-use-cases':
          operation.add(`x-openmcp-${key}`, response[key]);
          break;
        case 'purpose':
          purposes.push({
            id: operation.id,
            value: response[key],
          });
          break;
        default:
          log.write('warn', `Encountered unknown key ${JSON.stringify(key)} in response`);
      }
    }

    messages.push({ role: 'assistant', content: prettyStringify(response) });
  };
}
