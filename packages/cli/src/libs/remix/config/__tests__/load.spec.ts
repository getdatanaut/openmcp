import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';

import { type IO } from '@openmcp/utils/documents';
import { describe, expect, it, vi } from 'vitest';

import load from '../load.ts';

const fixturesDir = path.join(import.meta.dirname, 'fixtures');

describe('load', () => {
  it.concurrent('should load a valid config file', async () => {
    const io: IO = {
      fetch: vi.fn(),
      fs,
    };
    const configPath = path.join(fixturesDir, 'valid-config.json');
    const validConfigContent = await fs.readFile(configPath, 'utf8');
    const validConfig = JSON.parse(validConfigContent);

    await expect(load({ io, env: {}, cwd: fixturesDir }, configPath)).resolves.toStrictEqual(validConfig);
  });

  it.concurrent('should resolve environment variables in client config', async () => {
    const io: IO = {
      fetch: vi.fn(),
      fs,
    };
    const configPath = path.join(fixturesDir, 'config-with-env.json');
    const configContent = await fs.readFile(configPath, 'utf8');
    const expectedConfig = JSON.parse(configContent);
    expectedConfig.configs.test_server.ENV_VAR = 'resolved_value';

    await expect(load({ io, env: { ENV_VAR: 'resolved_value' }, cwd: fixturesDir }, configPath)).resolves.toStrictEqual(
      expectedConfig,
    );
  });

  it.concurrent('should throw an error for undefined environment variables', async () => {
    const io: IO = {
      fetch: vi.fn(),
      fs,
    };
    const configPath = path.join(fixturesDir, 'config-with-undefined-env.json');

    await expect(load({ io, env: {}, cwd: fixturesDir }, configPath)).rejects.toThrow(
      'Environment variable UNDEFINED_ENV_VAR is not defined',
    );
  });

  it.concurrent('should resolve file URLs for OpenAPI paths', async () => {
    const io: IO = {
      fetch: vi.fn(),
      fs,
    };
    await using tmpDir = await useTmpDir();
    const fixturePath = path.join(fixturesDir, 'config-with-file-url.json');
    const configPath = path.join(String(tmpDir), 'config-with-file-url-test.json');
    const fixtureContent = await fs.readFile(fixturePath, 'utf8');
    const config = JSON.parse(fixtureContent);

    // Create a real file URL for the test
    const openapiPath = path.join(String(tmpDir), 'openapi.json');
    const fileUrl = `file://${openapiPath}`;

    // Replace the placeholder with the real file URL
    config.servers.test_server.openapi = fileUrl;

    // Write the modified config to the temp directory
    await fs.writeFile(configPath, JSON.stringify(config));

    // File URIs are not rewritten, so the file URL should remain unchanged
    await expect(load({ io, env: {}, cwd: String(tmpDir) }, configPath)).resolves.toHaveProperty(
      'servers.test_server.openapi',
      fileUrl,
    );
  });

  it.concurrent('should not modify absolute OpenAPI paths', async () => {
    const io: IO = {
      fetch: vi.fn(),
      fs,
    };
    await using tmpDir = await useTmpDir();
    const fixturePath = path.join(fixturesDir, 'config-with-absolute-path.json');
    const configPath = path.join(String(tmpDir), 'config-with-absolute-path-test.json');
    const fixtureContent = await fs.readFile(fixturePath, 'utf8');
    const config = JSON.parse(fixtureContent);

    const absolutePath = path.join(String(tmpDir), 'absolute/path/to/openapi.json');

    // Replace the placeholder with the real absolute path
    config.servers.test_server.openapi = absolutePath;

    // Write the modified config to the temp directory
    await fs.writeFile(configPath, JSON.stringify(config));

    // The absolute path should not be modified
    await expect(load({ io, env: {}, cwd: String(tmpDir) }, configPath)).resolves.toHaveProperty(
      'servers.test_server.openapi',
      absolutePath,
    );
  });

  it.concurrent('should resolve OpenAPI URLs', async () => {
    const io: IO = {
      fetch: vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {
          get: vi.fn().mockReturnValue('application/json'),
        },
        text: vi.fn().mockResolvedValue(
          JSON.stringify({
            openapi: '3.0.0',
            info: {
              title: 'Test API',
              version: '1.0.0',
            },
            paths: {},
          }),
        ),
      }),
      fs,
    };

    const configPath = path.join(fixturesDir, 'config-with-url.json');
    const fixtureContent = await fs.readFile(configPath, 'utf8');
    const config = JSON.parse(fixtureContent);
    const expectedUrl = config.servers.test_server.openapi;

    await expect(load({ io, env: {}, cwd: fixturesDir }, configPath)).resolves.toHaveProperty(
      'servers.test_server.openapi',
      expectedUrl,
    );
  });

  it.concurrent('should load a config from a URL', async () => {
    const configUrl = 'https://example.com/config.json';
    const fixturePath = path.join(fixturesDir, 'remote-config.json');
    const fixtureContent = await fs.readFile(fixturePath, 'utf8');
    const validConfig = JSON.parse(fixtureContent);

    const io: IO = {
      fetch: vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {
          get: vi.fn().mockReturnValue('application/json'),
        },
        text: vi.fn().mockResolvedValue(fixtureContent),
      }),
      fs,
    };

    await expect(load({ io, env: {}, cwd: fixturesDir }, configUrl)).resolves.toStrictEqual(validConfig);
    expect(io.fetch).toHaveBeenCalledWith(new URL(configUrl));
  });

  it.concurrent("should resolve relative OpenAPI path relatively to config's URL", async () => {
    const configUrl = 'https://example.com/mcp/config.json';
    const fixturePath = path.join(fixturesDir, 'config-with-url.json');
    const config = JSON.parse(await fs.readFile(fixturePath, 'utf8'));

    config.servers.test_server.openapi = './openapi/test.json';

    const io: IO = {
      fetch: vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {
          get: vi.fn().mockReturnValue('application/json'),
        },
        text: vi.fn().mockResolvedValue(JSON.stringify(config)),
      }),
      fs,
    };

    await expect(load({ io, env: {}, cwd: fixturesDir }, configUrl)).resolves.toHaveProperty(
      'servers.test_server.openapi',
      'https://example.com/mcp/openapi/test.json',
    );
  });

  it.concurrent("should resolve absolute OpenAPI path relatively to config's URL origin", async () => {
    const configUrl = 'https://example.com/mcp/config.json';
    const fixturePath = path.join(fixturesDir, 'config-with-url.json');
    const config = JSON.parse(await fs.readFile(fixturePath, 'utf8'));

    config.servers.test_server.openapi = '/openapi/test.json';

    const io: IO = {
      fetch: vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {
          get: vi.fn().mockReturnValue('application/json'),
        },
        text: vi.fn().mockResolvedValue(JSON.stringify(config)),
      }),
      fs,
    };

    await expect(load({ io, env: {}, cwd: fixturesDir }, configUrl)).resolves.toHaveProperty(
      'servers.test_server.openapi',
      'https://example.com/openapi/test.json',
    );
  });
});

async function useTmpDir() {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'openmcp-remix-test-'));
  return {
    toString() {
      return tmpDir;
    },
    async [Symbol.asyncDispose]() {
      await fs.rm(tmpDir, { recursive: true, force: true });
    },
  };
}
