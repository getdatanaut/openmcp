import assert from 'node:assert/strict';
import { createWriteStream } from 'node:fs';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { createOpenAI } from '@ai-sdk/openai';
import PQueue from 'p-queue';

import processDocument from './processor/index.ts';
import formatErrorMessage from './utils/format-error-message.ts';
import { listFiles, resolveFileOutputPath } from './utils/fs.ts';
import WritableLog from './utils/writable-log.ts';

type Input = {
  readonly modelId: string;
  readonly cwd: string;
  readonly outputDir: string | null;
  readonly patterns: string[];
};

export default async ({ modelId, cwd, outputDir, patterns }: Input) => {
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  const apiKey = process.env['OPENAI_API_KEY'];
  assert.ok(apiKey, 'OPENAI_API_KEY environment variable is not set');

  const openai = createOpenAI({ apiKey });
  const model = openai.languageModel(modelId);

  const filepaths = await listFiles(cwd, patterns);

  const context = {
    model,
    cwd,
    filepaths,
    outputDir,
  } as const;

  const queue = new PQueue({ concurrency: 2 });
  const promises: Promise<void>[] = [];
  for (const filepath of filepaths) {
    promises.push(
      queue.add(async () => {
        const logFilepath = path.join(
          path.dirname(resolveFileOutputPath(filepaths, outputDir, filepath)),
          'enhancer.log',
        );

        await fs.mkdir(path.dirname(logFilepath), { recursive: true });
        using writableLog = new WritableLog(createWriteStream(logFilepath, { flags: 'a' }));

        try {
          await processDocument(
            {
              ...context,
              log: writableLog,
            },
            filepath,
          );
        } catch (e) {
          writableLog.write('error', `Error processing ${filepath}: ${formatErrorMessage(e)}`);
        }
      }),
    );
  }

  await Promise.all(promises);
};
