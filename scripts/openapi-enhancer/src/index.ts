import assert, { AssertionError } from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import process from 'node:process';
import { parseArgs } from 'node:util';

import OpenAI from 'openai';
import { isOk, unwrapErr, unwrapOk } from 'option-t/plain_result';
import PQueue from 'p-queue';

import callLLM from './llm/index.ts';
import { loadDocument } from './openapi/index.ts';
import { loadRolePrompt } from './prompts/index.ts';
import formatErrorMessage from './utils/format-error-message.ts';

const { values, positionals } = parseArgs({
  args: process.argv.slice(2),
  strict: true,
  allowPositionals: true,
  options: {
    output: {
      type: 'string',
      short: 'o',
    },
  },
});

try {
  process.loadEnvFile(path.join(import.meta.dirname, '../.env'));
} catch (error) {
  if (error?.['code'] !== 'ENOENT') {
    throw error;
  }

  console.warn('No .env file found, skipping loading environment variables');
}

try {
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  const apiKey = process.env['OPENAI_API_KEY'];
  assert.ok(apiKey, 'OPENAI_API_KEY environment variable is not set');

  const openai = new OpenAI({ apiKey });
  assert.ok(process.argv.length > 2, 'Usage: enhance-openapi [..path-to-openapi-spec]');

  const queue = new PQueue({ concurrency: 3 });
  const promises: Promise<void>[] = [];
  for (const filepath of positionals) {
    promises.push(
      queue.add(async () => {
        const document = await loadDocument(filepath);
        const prompt = await loadRolePrompt({ document: document.toString() });
        const response = callLLM(openai, prompt);
        const errors: unknown[] = [];

        for await (const operationResult of response) {
          if (isOk(operationResult)) {
            document.applyOperation(unwrapOk(operationResult));
          } else {
            errors.push(unwrapErr(operationResult));
          }
        }

        errors.push(...document.patchErrors);
        if (errors.length > 0) {
          console.warn(['The following errors occurred:', ...errors.map(formatErrorMessage)].join('\n'));
        }

        // Rank endpoints by importance, using service information for business context
        // const rankedEndpoints = await rankEndpoints(chunks, serviceInfo);
        const outputFilepath = getOutput(filepath);
        await fs.mkdir(path.dirname(outputFilepath), { recursive: true });
        await fs.writeFile(outputFilepath, document.toString());
      }),
    );
  }

  await Promise.all(promises);
} catch (error) {
  console.error(error instanceof AssertionError ? error.message : formatErrorMessage(error));
  process.exit(1);
}

function getOutput(filepath: string): string {
  const parsedPath = path.parse(filepath);
  if (values.output !== undefined) {
    return path.resolve(values.output, `${parsedPath.name}.yaml`);
  }

  return path.join(parsedPath.dir, `${parsedPath.name}.updated.yaml`);
}
