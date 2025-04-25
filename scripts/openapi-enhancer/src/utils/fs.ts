import fs from 'node:fs/promises';
import path from 'node:path';

import fg from 'fast-glob';

const { glob, isDynamicPattern } = fg;

export async function listFiles(cwd: string, values: string[]): Promise<string[]> {
  const filepaths: string[] = [];
  const promises: Promise<void>[] = [];
  const config = {
    cwd,
    absolute: true,
  };

  for (const pattern of values) {
    if (isDynamicPattern(pattern)) {
      promises.push(
        glob(pattern, config).then(files => {
          filepaths.push(...files);
        }),
      );
    } else {
      filepaths.push(pattern);
    }
  }

  await Promise.all(promises);
  return Array.from(new Set(filepaths));
}

export async function safeWriteFile(filepath: string, data: string): Promise<void> {
  try {
    await fs.writeFile(filepath, data);
  } catch (error) {
    if (error instanceof Error && error['code'] === 'ENOENT') {
      // If the directory does not exist, create it
      await fs.mkdir(path.dirname(filepath), { recursive: true });
      await fs.writeFile(filepath, data);
    } else {
      throw error;
    }
  }
}

export function resolveFileOutputPath(allFiles: string[], outputDir: string | null, filepath: string): string {
  const parsedPath = path.parse(filepath);
  if (outputDir === null) {
    return path.join(parsedPath.dir, `${parsedPath.name}.updated.json`);
  }

  const allParts: Set<string>[] = [];
  for (const file of allFiles) {
    if (file === filepath) continue;

    const parts = file.slice(1).split(path.sep).reverse();
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]!;
      if (allParts.length <= i) {
        allParts.push(new Set([part]));
      } else {
        allParts[i]!.add(part);
      }
    }
  }

  let parts = filepath.slice(1).split(path.sep).reverse();
  let outputPath = '';
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]!;
    outputPath = path.join(outputDir, ...parts.slice(1, i + 1).reverse());
    if (allParts.length <= i || !allParts[i]!.has(part)) {
      break;
    }
  }

  return path.join(outputPath, `${parsedPath.name}.json`);
}
