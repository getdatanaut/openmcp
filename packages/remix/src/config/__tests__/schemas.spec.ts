import { describe, expect, it } from 'vitest';

import { ConfigSchema, RemixServerSchema } from '../schemas.ts';

describe('ConfigSchema', () => {
  it('should validate a configuration with valid server names', () => {
    const validConfig = {
      configs: {
        valid_server_1: { key1: 'value1' },
        valid_server_2: { key1: 'value1' },
      },
      servers: {
        valid_server_1: {
          type: 'sse',
          url: 'https://example.com',
          headers: { 'x-openmcp': 'token' },
          tools: [{ name: 'tool1' }],
        },
        valid_server_2: {
          type: 'openapi',
          serverConfig: {
            openapi: 'https://example.com/openapi.json',
            serverUrl: 'https://example.com',
          },
          tools: [{ name: 'tool2' }],
        },
      },
    };

    expect(ConfigSchema.safeParse(validConfig)).toHaveProperty('success', true);
  });

  it('should not accept invalid server names', () => {
    const invalidConfig = {
      configs: {
        group1: { key1: 'value1' },
      },
      servers: {
        'invalid_server_name!': {
          type: 'sse',
          url: 'https://example.com',
          tools: [{ name: 'tool1' }],
        },
      },
    };

    expect(ConfigSchema.safeParse(invalidConfig)).toHaveProperty('success', false);
  });

  it('should not accept a config key without server definition', () => {
    const invalidConfig = {
      configs: {
        group1: { key1: 'value1' },
      },
      servers: {
        group2: {
          type: 'sse',
          url: 'https://example.com',
          tools: [{ name: 'tool1' }],
        },
      },
    };

    expect(ConfigSchema.safeParse(invalidConfig)).toHaveProperty('success', false);
  });

  it('should validate a server definition with no config', () => {
    const invalidConfig = {
      configs: {},
      servers: {
        group1: {
          type: 'sse',
          url: 'https://example.com',
          tools: [{ name: 'tool1' }],
        },
      },
    };

    expect(ConfigSchema.safeParse(invalidConfig)).toHaveProperty('success', true);
  });
});

describe('RemixServerSchema', () => {
  it('should validate an SSE server with optional headers', () => {
    const validSSEServer = {
      type: 'sse',
      url: 'https://example.com',
      headers: { 'x-openmcp': 'token' },
      tools: [{ name: 'tool1' }],
    };

    expect(RemixServerSchema.safeParse(validSSEServer)).toHaveProperty('success', true);
  });

  it('should not accept an SSE server with invalid URL', () => {
    const invalidSSEServer = {
      type: 'sse',
      url: 'invalid-url',
      headers: { 'x-openmcp': 'token' },
      tools: [{ name: 'tool1' }],
    };

    expect(RemixServerSchema.safeParse(invalidSSEServer)).toHaveProperty('success', false);
  });

  it('should not accept an SSE server without tools', () => {
    const invalidSSEServer = {
      type: 'sse',
      url: 'https://example.com',
    };

    expect(RemixServerSchema.safeParse(invalidSSEServer)).toHaveProperty('success', false);
  });

  it('should validate an OpenAPI server with valid configurations', () => {
    const validOpenAPIServer = {
      type: 'openapi',
      serverConfig: {
        openapi: 'https://example.com/openapi.json',
        serverUrl: 'https://example.com',
      },
      tools: [{ name: 'tool2' }],
    };

    expect(RemixServerSchema.safeParse(validOpenAPIServer)).toHaveProperty('success', true);
  });

  it('should not accept an OpenAPI server with missing serverConfig', () => {
    const invalidOpenAPIServer = {
      type: 'openapi',
      tools: [{ name: 'tool2' }],
    };

    expect(RemixServerSchema.safeParse(invalidOpenAPIServer)).toHaveProperty('success', false);
  });

  it('should not accept an OpenAPI server with invalid serverConfig', () => {
    const invalidOpenAPIServer = {
      type: 'openapi',
      serverConfig: {
        openapi: 'invalid-url',
        serverUrl: 'https://example.com',
      },
      tools: [{ name: 'tool2' }],
    };

    expect(RemixServerSchema.safeParse(invalidOpenAPIServer)).toHaveProperty('success', false);
  });

  it('should validate a StdIO server with non-empty command and arguments', () => {
    const validStdIOServer = {
      type: 'stdio',
      command: 'echo',
      args: ['hello', 'world'],
      tools: [{ name: 'tool3' }],
    };

    expect(RemixServerSchema.safeParse(validStdIOServer)).toHaveProperty('success', true);
  });

  it('should not accept a StdIO server with empty command', () => {
    const invalidStdIOServer = {
      type: 'stdio',
      command: '',
      args: ['arg1'],
      tools: [{ name: 'tool3' }],
    };

    const result = RemixServerSchema.safeParse(invalidStdIOServer);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('Command must be provided');
  });

  it('should not accept a StdIO server without tools', () => {
    const invalidStdIOServer = {
      type: 'stdio',
      command: 'echo',
      args: ['hello', 'world'],
    };

    expect(RemixServerSchema.safeParse(invalidStdIOServer)).toHaveProperty('success', false);
  });

  it('should validate a server with additional unknown properties', () => {
    const validServerWithExtras = {
      type: 'sse',
      url: 'https://example.com',
      tools: [{ name: 'tool1' }],
      extraProperty: 'extraValue',
    };

    expect(RemixServerSchema.safeParse(validServerWithExtras)).toHaveProperty('success', true);
  });
});
