import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import readDocument, { type IO } from '../read.ts';

const fixturesDir = path.join(import.meta.dirname, 'fixtures');

describe('readDocument', () => {
  it.concurrent('should read a document from the filesystem', async () => {
    const filepath = path.join(fixturesDir, 'valid-document.json');
    const io: IO = {
      fetch: vi.fn(),
      fs,
    };

    const expectedContent = await fs.readFile(filepath, 'utf8');

    await expect(readDocument(io, filepath)).resolves.toStrictEqual({
      content: expectedContent,
      type: 'json',
    });
  });

  it.concurrent('should read a document from a file URL', async () => {
    const filepath = path.join(fixturesDir, 'valid-document.json');
    const fileUrl = `file://${filepath}`;
    const io: IO = {
      fetch: vi.fn(),
      fs,
    };

    const expectedContent = await fs.readFile(filepath, 'utf8');

    await expect(readDocument(io, fileUrl)).resolves.toEqual({
      content: expectedContent,
      type: 'json',
    });
  });

  it.concurrent('should read a document from an HTTP URL', async () => {
    const url = 'http://example.com/document.json';
    const content = '{"test": "content"}';
    const io: IO = {
      fetch: vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {
          get: vi.fn().mockReturnValue('application/json'),
        },
        text: vi.fn().mockResolvedValue(content),
      }),
      fs,
    };

    await expect(readDocument(io, url)).resolves.toEqual({
      content,
      type: 'json',
    });
    expect(io.fetch).toHaveBeenCalledWith(new URL(url));
  });

  it.concurrent('should read a document from an HTTPS URL', async () => {
    const url = 'https://example.com/document.json';
    const content = '{"test": "content"}';
    const io: IO = {
      fetch: vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {
          get: vi.fn().mockReturnValue('application/json'),
        },
        text: vi.fn().mockResolvedValue(content),
      }),
      fs,
    };

    await expect(readDocument(io, url)).resolves.toStrictEqual({
      content,
      type: 'json',
    });
    expect(io.fetch).toHaveBeenCalledWith(new URL(url));
  });

  it.concurrent('should determine type from Content-Type header for HTTP requests', async () => {
    const url = 'https://example.com/document';
    const content = 'title: Test\nversion: 1.0.0';
    const io: IO = {
      fetch: vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {
          get: vi.fn().mockReturnValue('application/yaml'),
        },
        text: vi.fn().mockResolvedValue(content),
      }),
      fs,
    };

    await expect(readDocument(io, url)).resolves.toStrictEqual({
      content,
      type: 'yaml',
    });
  });

  it.concurrent('should determine type from file extension when Content-Type is not available', async () => {
    const url = 'https://example.com/document.yml';
    const content = 'title: Test\nversion: 1.0.0';
    const io: IO = {
      fetch: vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {
          get: vi.fn().mockReturnValue(null),
        },
        text: vi.fn().mockResolvedValue(content),
      }),
      fs,
    };

    await expect(readDocument(io, url)).resolves.toStrictEqual({
      content,
      type: 'yml',
    });
  });

  it.concurrent('should throw an error for unsupported protocols', async () => {
    const url = 'ftp://example.com/document.json';
    const io: IO = {
      fetch: vi.fn(),
      fs,
    };

    expect(() => {
      // We need to wrap this in a function because the error is thrown synchronously
      // when creating the URL object, not as a rejected promise
      void readDocument(io, url);
    }).toThrow('Unsupported protocol: ftp:');
  });

  it.concurrent('should throw an error when HTTP request fails', async () => {
    const url = 'https://example.com/document.json';
    const io: IO = {
      fetch: vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: {
          get: vi.fn(),
        },
        text: vi.fn(),
      }),
      fs: {
        readFile: async (path, encoding) => fs.readFile(path, encoding),
      },
    };

    await expect(readDocument(io, url)).rejects.toThrow(`Failed to fetch ${url}: Not Found`);
  });
});
