import type { CoreMessage } from 'ai';

import { getChunks, loadDocument } from '../openapi/index.ts';
import { resolveFileOutputPath, safeWriteFile } from '../utils/fs.ts';
import createObjectProcessor from './operation.ts';
import generateRanking from './ranking.ts';
import processService from './service.ts';
import type { Context, Purpose } from './types.ts';

export default async function processDocument(ctx: Context, filepath: string): Promise<void> {
  const { filepaths, outputDir, log } = ctx;
  log.write('info', `Loading ${filepath}`);
  const document = await loadDocument(filepath);
  log.write('info', `Loaded ${filepath}`);

  const messages: CoreMessage[] = [];
  const purposes: Purpose[] = [];
  const processObject = createObjectProcessor(ctx, purposes);

  for (using chunk of getChunks(document)) {
    switch (chunk.kind) {
      case 'service':
        await processService(messages, chunk);
        break;
      case 'operation':
        await processObject(messages, chunk);
        break;
      default:
        log.write('warn', `Encountered unknown chunk "${chunk['kind']}"`);
        break;
    }
  }

  document['x-openmcp-ranking'] = await generateRanking(ctx, messages, purposes);

  const outputFilepath = resolveFileOutputPath(filepaths, outputDir, filepath);
  await safeWriteFile(outputFilepath, JSON.stringify(document, null, 2));
}
