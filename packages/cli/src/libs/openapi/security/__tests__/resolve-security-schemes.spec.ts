import { describe, expect, it } from 'vitest';

import resolveSecuritySchemes from '../resolve-security-schemes.ts';
import { apiKeySecurityFragment } from './fixtures/api-key-security-fragment.ts';
import { emptySecurityArrayFragment } from './fixtures/empty-security-array-fragment.ts';
import { emptySecurityFragment } from './fixtures/empty-security-fragment.ts';
import { httpBasicSecurityFragment } from './fixtures/http-basic-security-fragment.ts';
import { httpBearerSecurityFragment } from './fixtures/http-bearer-security-fragment.ts';
import { httpBearerWithFormatSecurityFragment } from './fixtures/http-bearer-with-format-security-fragment.ts';
import { httpUnsupportedSchemeFragment } from './fixtures/http-unsupported-scheme-fragment.ts';
import { multipleAndSecurityFragment } from './fixtures/multiple-and-security-fragment.ts';
import { multipleOrSecurityFragment } from './fixtures/multiple-or-security-fragment.ts';
import { mutualTlsSecurityFragment } from './fixtures/mutual-tls-security-fragment.ts';
import { noGlobalSecurityFragment } from './fixtures/no-global-security-fragment.ts';
import { oauth2SecurityFragment } from './fixtures/oauth2-security-fragment.ts';
import { openIdConnectSecurityFragment } from './fixtures/openid-connect-security-fragment.ts';

describe('resolveSecuritySchemes', () => {
  it('should return an empty array when service has no security and no securitySchemes', () => {
    const result = resolveSecuritySchemes(emptySecurityFragment);
    expect(result).toStrictEqual([]);
  });

  it('should return an empty array when service has empty security array', () => {
    const result = resolveSecuritySchemes(emptySecurityArrayFragment);
    expect(result).toStrictEqual([]);
  });

  it('should use all available schemes when no global security is defined', () => {
    const result = resolveSecuritySchemes(noGlobalSecurityFragment);
    expect(result).toStrictEqual([
      [
        {
          name: 'API Key',
          type: 'apiKey',
          supported: true,
          securityScheme: {
            id: 'api-key-header',
            type: 'apiKey',
            name: 'X-API-KEY',
            in: 'header',
          },
        },
      ],
      [
        {
          name: 'API Key',
          type: 'apiKey',
          supported: true,
          securityScheme: {
            id: 'api-key-query',
            type: 'apiKey',
            name: 'api_key',
            in: 'query',
          },
        },
      ],
      [
        {
          name: 'API Key',
          type: 'apiKey',
          supported: false,
          securityScheme: {
            id: 'api-key-cookie',
            type: 'apiKey',
            name: 'api_key',
            in: 'cookie',
          },
        },
      ],
    ]);
  });

  it('should handle API Key security schemes', () => {
    const result = resolveSecuritySchemes(apiKeySecurityFragment);
    expect(result).toStrictEqual([
      [
        {
          name: 'API Key',
          type: 'apiKey',
          supported: true,
          securityScheme: {
            id: 'api-key-header',
            type: 'apiKey',
            name: 'X-API-KEY',
            in: 'header',
          },
        },
      ],
    ]);
  });

  it('should handle HTTP Basic security scheme', () => {
    const result = resolveSecuritySchemes(httpBasicSecurityFragment);
    expect(result).toStrictEqual([
      [
        {
          name: 'Basic Authentication',
          type: 'http',
          supported: true,
          securityScheme: {
            id: 'basic-auth',
            type: 'http',
            scheme: 'basic',
          },
        },
      ],
    ]);
  });

  it('should handle HTTP Bearer security scheme', () => {
    const result = resolveSecuritySchemes(httpBearerSecurityFragment);
    expect(result).toStrictEqual([
      [
        {
          name: 'Bearer Token',
          type: 'http',
          supported: true,
          securityScheme: {
            id: 'bearer-auth',
            type: 'http',
            scheme: 'bearer',
          },
        },
      ],
    ]);
  });

  it('should handle HTTP Bearer security scheme with format', () => {
    const result = resolveSecuritySchemes(httpBearerWithFormatSecurityFragment);
    expect(result).toStrictEqual([
      [
        {
          name: 'Bearer Token (JWT)',
          type: 'http',
          supported: true,
          securityScheme: {
            id: 'bearer-auth-jwt',
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      ],
    ]);
  });

  it('should handle HTTP security scheme with unsupported scheme', () => {
    const result = resolveSecuritySchemes(httpUnsupportedSchemeFragment);
    expect(result).toStrictEqual([
      [
        {
          name: 'HTTP digest',
          type: 'http',
          supported: false,
          securityScheme: {
            id: 'digest-auth',
            type: 'http',
            scheme: 'digest',
          },
        },
      ],
    ]);
  });

  it('should handle OAuth2 security scheme', () => {
    const result = resolveSecuritySchemes(oauth2SecurityFragment);
    expect(result).toStrictEqual([
      [
        {
          name: 'OAuth2',
          type: 'oauth2',
          supported: true,
          securityScheme: {
            id: 'oauth2-auth',
            type: 'oauth2',
            flows: {
              implicit: {
                authorizationUrl: 'https://example.com/oauth/authorize',
                scopes: {
                  'read:api': 'Read access to the API',
                  'write:api': 'Write access to the API',
                },
              },
            },
          },
        },
      ],
    ]);
  });

  it('should handle OpenID Connect security scheme', () => {
    const result = resolveSecuritySchemes(openIdConnectSecurityFragment);
    expect(result).toStrictEqual([
      [
        {
          name: 'OpenID Connect (https://example.com/.well-known/openid-configuration)',
          type: 'openIdConnect',
          supported: false,
          securityScheme: {
            id: 'openid-auth',
            type: 'openIdConnect',
            openIdConnectUrl: 'https://example.com/.well-known/openid-configuration',
          },
        },
      ],
    ]);
  });

  it('should handle Mutual TLS security scheme', () => {
    const result = resolveSecuritySchemes(mutualTlsSecurityFragment);
    expect(result).toStrictEqual([
      [
        {
          name: 'Mutual TLS',
          type: 'mutualTLS',
          supported: false,
          securityScheme: {
            id: 'mtls-auth',
            type: 'mutualTLS',
          },
        },
      ],
    ]);
  });

  it('should handle multiple security schemes (AND relationship)', () => {
    const result = resolveSecuritySchemes(multipleAndSecurityFragment);
    expect(result).toStrictEqual([
      [
        {
          name: 'API Key',
          type: 'apiKey',
          supported: true,
          securityScheme: {
            id: 'api-key-header',
            type: 'apiKey',
            name: 'X-API-KEY',
            in: 'header',
          },
        },
        {
          name: 'Bearer Token',
          type: 'http',
          supported: true,
          securityScheme: {
            id: 'bearer-auth',
            type: 'http',
            scheme: 'bearer',
          },
        },
      ],
    ]);
  });

  it('should handle multiple security schemes (OR relationship)', () => {
    const result = resolveSecuritySchemes(multipleOrSecurityFragment);
    expect(result).toStrictEqual([
      [
        {
          name: 'API Key',
          type: 'apiKey',
          supported: true,
          securityScheme: {
            id: 'api-key-header',
            type: 'apiKey',
            name: 'X-API-KEY',
            in: 'header',
          },
        },
      ],
      [
        {
          name: 'Bearer Token',
          type: 'http',
          supported: true,
          securityScheme: {
            id: 'bearer-auth',
            type: 'http',
            scheme: 'bearer',
          },
        },
      ],
    ]);
  });
});
