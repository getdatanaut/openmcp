import type {
  HttpSecurityScheme,
  IApiKeySecurityScheme,
  IBasicSecurityScheme,
  IBearerSecurityScheme,
  IHttpService,
  IMutualTLSSecurityScheme,
  IOauth2SecurityScheme,
  IOpenIdConnectSecurityScheme,
} from '@stoplight/types';

export type ResolvedSecurityScheme = {
  name: string;
  supported: boolean;
} & (
  | {
      type: 'apiKey';
      securityScheme: IApiKeySecurityScheme;
    }
  | {
      type: 'http';
      securityScheme: IBasicSecurityScheme | IBearerSecurityScheme;
    }
  | {
      type: 'oauth2';
      securityScheme: IOauth2SecurityScheme;
    }
  | {
      type: 'openIdConnect';
      securityScheme: IOpenIdConnectSecurityScheme;
    }
  | {
      type: 'mutualTLS';
      securityScheme: IMutualTLSSecurityScheme;
    }
);

export default function resolveSecuritySchemes(
  service: Pick<IHttpService, 'security' | 'securitySchemes'>,
): ResolvedSecurityScheme[][] {
  let schemes = service.security;
  // if no global security is defined, let's fall back to all available schemes
  if (!schemes || schemes.length === 0) {
    schemes = (service.securitySchemes ?? []).map(scheme => [scheme]);
  }

  return schemes.map(s => s.map(resolveSecurityScheme));
}

function resolveSecurityScheme(securityScheme: HttpSecurityScheme): ResolvedSecurityScheme {
  // Create a new securityScheme object without the key property
  const { key, ...schemeWithoutKey } = securityScheme;

  const result = {
    name: '',
    type: securityScheme.type,
    supported: securityScheme.type === 'apiKey' || securityScheme.type === 'http',
    securityScheme: schemeWithoutKey,
  };

  switch (securityScheme.type) {
    case 'apiKey':
      result.supported = securityScheme.in === 'header' || securityScheme.in === 'query';
      result.name = 'API Key';
      break;
    case 'http':
      if (securityScheme.scheme === 'basic') {
        result.name = 'Basic Authentication';
      } else if (securityScheme.scheme === 'bearer') {
        result.name = securityScheme.bearerFormat ? `Bearer Token (${securityScheme.bearerFormat})` : 'Bearer Token';
      } else {
        result.name = `HTTP ${securityScheme.scheme}`;
        result.supported = false;
      }
      break;
    case 'oauth2':
      result.name = 'OAuth2';
      result.supported = true;
      break;
    case 'openIdConnect':
      result.name = `OpenID Connect (${securityScheme.openIdConnectUrl})`;
      break;
    case 'mutualTLS':
      result.name = 'Mutual TLS';
      break;
  }

  return result as ResolvedSecurityScheme;
}
