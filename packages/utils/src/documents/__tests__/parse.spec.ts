import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import { describe, expect, it } from 'vitest';

import parseDocument from '../parse.ts';

const fixturesDir = path.join(import.meta.dirname, 'fixtures');

describe('parseDocument', () => {
  it.concurrent('should parse a valid JSON document', async () => {
    const filepath = path.join(fixturesDir, 'valid-document.json');
    const content = await fs.readFile(filepath, 'utf8');
    const result = parseDocument(content, 'json');

    expect(result).toMatchObject({
      openapi: '3.0.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
        description: 'A test API for loadDocument'
      },
      paths: {
        '/test': {
          get: {
            summary: 'Test endpoint',
            responses: {
              '200': {
                description: 'OK'
              }
            }
          }
        }
      }
    });
  });

  it.concurrent('should parse a valid YAML document', async () => {
    const filepath = path.join(fixturesDir, 'valid-document.yaml');
    const content = await fs.readFile(filepath, 'utf8');
    const result = parseDocument(content, 'yaml');

    expect(result).toMatchObject({
      openapi: '3.0.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
        description: 'A test API for loadDocument'
      },
      paths: {
        '/test': {
          get: {
            summary: 'Test endpoint',
            responses: {
              '200': {
                description: 'OK'
              }
            }
          }
        }
      }
    });
  });

  it.concurrent('should parse a valid YML document', async () => {
    const filepath = path.join(fixturesDir, 'valid-document.yml');
    const content = await fs.readFile(filepath, 'utf8');
    const result = parseDocument(content, 'yml');

    expect(result).toMatchObject({
      openapi: '3.0.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
        description: 'A test API for loadDocument'
      },
      paths: {
        '/test': {
          get: {
            summary: 'Test endpoint',
            responses: {
              '200': {
                description: 'OK'
              }
            }
          }
        }
      }
    });
  });

  it.concurrent('should parse a valid JSON document as JSONC', async () => {
    const filepath = path.join(fixturesDir, 'valid-document.jsonc');
    const content = await fs.readFile(filepath, 'utf8');
    const result = parseDocument(content, 'jsonc');

    expect(result).toMatchObject({
      title: 'Test Document',
      version: '1.0.0',
      description: 'A test document for document utils',
      properties: {
        name: {
          type: 'string',
        },
        age: {
          type: 'number',
        },
      },
    });
  });

  it.concurrent('should throw an error for invalid JSON', async () => {
    const filepath = path.join(fixturesDir, 'invalid-document.json');
    const content = await fs.readFile(filepath, 'utf8');

    expect(() => parseDocument(content, 'json')).toThrow('Failed to parse document:');
  });

  it.concurrent('should throw an error for invalid YAML', async () => {
    const filepath = path.join(fixturesDir, 'invalid-document.yaml');
    const content = await fs.readFile(filepath, 'utf8');

    expect(() => parseDocument(content, 'yaml')).toThrow('Failed to parse document:');
  });

  it.concurrent('should throw an error for unsupported file types', async () => {
    const filepath = path.join(fixturesDir, 'unsupported-document.txt');
    const content = await fs.readFile(filepath, 'utf8');

    expect(() => parseDocument(content, 'txt')).toThrow('Unsupported file type: txt');
  });

  it.concurrent('should throw an error when document is not an object', async () => {
    const filepath = path.join(fixturesDir, 'non-object-document.json');
    const content = await fs.readFile(filepath, 'utf8');

    expect(() => parseDocument(content, 'json')).toThrow('Failed to parse document: document is not an object');
  });
});
