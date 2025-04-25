import type { LanguageModel } from 'ai';

import type WritableLog from '../utils/writable-log.ts';

export type Context = {
  readonly model: LanguageModel;
  readonly filepaths: string[];
  readonly outputDir: string | null;
  readonly log: WritableLog;
};

export type Purpose = {
  id: string;
  value: string;
};
