import * as path from 'node:path';

import { describe, expect, it } from 'vitest';

import loadDocument from '../load-document.ts';

const fixturesDir = path.join(import.meta.dirname, 'fixtures');

describe('loadDocument', () => {
  it.concurrent('should load a valid JSON document', async () => {
    const filepath = path.join(fixturesDir, 'valid-document.json');
    const result = await loadDocument(filepath);

    expect(result).toMatchObject({
      openapi: '3.0.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
        description: 'A test API for loadDocument',
      },
    });
  });

  it.concurrent('should load a valid YAML document', async () => {
    const filepath = path.join(fixturesDir, 'valid-document.yaml');
    const result = await loadDocument(filepath);

    expect(result).toMatchObject({
      openapi: '3.0.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
        description: 'A test API for loadDocument',
      },
    });
  });

  it.concurrent('should also load a valid YML document', async () => {
    const filepath = path.join(fixturesDir, 'valid-document.yml');
    const result = await loadDocument(filepath);

    expect(result).toMatchObject({
      openapi: '3.0.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
        description: 'A test API for loadDocument',
      },
    });
  });

  it.concurrent('should throw an error for invalid JSON', async () => {
    const filepath = path.join(fixturesDir, 'invalid-document.json');
    await expect(loadDocument(filepath)).rejects.toThrow('Failed to parse document:');
  });

  it.concurrent('should throw an error for invalid YAML', async () => {
    const filepath = path.join(fixturesDir, 'invalid-document.yaml');
    await expect(loadDocument(filepath)).rejects.toThrow('Failed to parse document:');
  });

  it.concurrent('should throw an error for unsupported file types', async () => {
    const filepath = path.join(fixturesDir, 'unsupported-document.txt');
    await expect(loadDocument(filepath)).rejects.toThrow(`Unsupported file type: ${filepath}`);
  });

  it.concurrent('should throw an error when document is not an object', async () => {
    const filepath = path.join(fixturesDir, 'non-object-document.json');
    await expect(loadDocument(filepath)).rejects.toThrow('Failed to parse document: document is not an object');
  });
});
