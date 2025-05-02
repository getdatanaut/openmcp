import type { OpenAPIServer } from '@openmcp/remix';
import type { HttpSecurityScheme, IHttpService } from '@stoplight/types';

import console, { prompt } from '#libs/console';

import { interpolable } from '../../../utils/string.ts';
import { type ResolvedSecurityScheme, resolveSecuritySchemes } from '../security/index.ts';

type SecurityConfig = {
  readonly userConfig: Record<string, unknown>;
  readonly serverClientConfig: NonNullable<OpenAPIServer['clientConfig']>;
};

type Context = {
  generateConfigKey(key: string): string;
  generateConfigValue(key: string): string;
};

export default async function negotiateSecurityConfig(ctx: Context, service: IHttpService): Promise<SecurityConfig> {
  const resolvedSecuritySchemes = resolveSecuritySchemes(service);
  const supported = resolvedSecuritySchemes.filter(allSupported);
  if (supported.length === 0) {
    throw new Error('No supported security schemes found. Please configure authentication manually.');
  }

  const config: SecurityConfig = {
    userConfig: {},
    serverClientConfig: {},
  };

  try {
    const strategy = supported.length === 1 ? supported[0]! : await negotiateStrategy(supported);
    for (const scheme of strategy) {
      await negotiateValuesForScheme(ctx, config, scheme);
    }
  } catch {
    console.warn('No security has been configured. Please configure authentication manually once openmcp is created.');
  }

  return config;
}

async function negotiateStrategy(strategies: ResolvedSecurityScheme[][]): Promise<ResolvedSecurityScheme[]> {
  const options: { label: string; value: string }[] = [];
  for (const [i, strategy] of strategies.entries()) {
    options.push({
      label: strategy.map(scheme => scheme.name).join(' & '),
      value: String(i),
    });
  }

  const choice = await prompt.select({
    message: 'We detected multiple auth strategy. Please select one:',
    options,
  });

  return strategies[Number(choice)]!;
}

async function negotiateValuesForScheme(
  ctx: Context,
  config: SecurityConfig,
  resolvedSecurityScheme: ResolvedSecurityScheme,
): Promise<void> {
  switch (resolvedSecurityScheme.type) {
    case 'apiKey':
      return negotiateValuesForApiKeyScheme(ctx, config, resolvedSecurityScheme);
    case 'http':
      return negotiateValuesForHttpScheme(ctx, config, resolvedSecurityScheme);
    case 'oauth2':
      return negotiateValuesForOauth2Scheme(ctx, config, resolvedSecurityScheme);
    case 'mutualTLS':
    case 'openIdConnect':
    default:
      throw new Error(`Unsupported security scheme: ${resolvedSecurityScheme.type}`);
  }
}

async function negotiateValuesForApiKeyScheme(
  ctx: Context,
  { userConfig, serverClientConfig }: SecurityConfig,
  resolvedSecurityScheme: ResolvedSecurityScheme & { type: 'apiKey' },
): Promise<void> {
  const value = await tokenPrompt('API Key', resolvedSecurityScheme.securityScheme.description);
  const key = ctx.generateConfigKey('api key');
  userConfig[key] = value.trim().length === 0 ? ctx.generateConfigValue('api key') : value;

  const paramName = resolvedSecurityScheme.securityScheme.name;
  switch (resolvedSecurityScheme.securityScheme.in) {
    case 'header':
      (serverClientConfig.headers ??= {})[paramName] = interpolable(key);
      break;
    case 'query':
      (serverClientConfig.query ??= {})[paramName] = interpolable(key);
      break;
    case 'cookie':
    default:
      throw new Error('Unexpected security scheme');
  }
}

async function negotiateValuesForHttpScheme(
  ctx: Context,
  config: SecurityConfig,
  resolvedSecurityScheme: ResolvedSecurityScheme & { type: 'http' },
): Promise<void> {
  switch (resolvedSecurityScheme.securityScheme.scheme) {
    case 'basic':
      await negotiateBasicAuth(ctx, config);
      break;
    case 'bearer':
      await negotiateBearerToken(ctx, config, resolvedSecurityScheme);
      break;
    case 'digest':
    default:
      throw new Error('Unexpected security scheme');
  }
}

async function negotiateBasicAuth(ctx: Context, { userConfig, serverClientConfig }: SecurityConfig): Promise<void> {
  console.info(
    'This API uses Basic Authentication. Please insert your username and password. The password will be stored on your computer.',
  );
  const username = await prompt.username();
  const password = await prompt.password();
  const value = btoa(`${username}:${password}`);
  const key = ctx.generateConfigKey('basic auth');
  userConfig[key] = value;
  (serverClientConfig.headers ??= {})['Authorization'] = `Basic ${interpolable(key)}`;
}

async function negotiateBearerToken(
  ctx: Context,
  { userConfig, serverClientConfig }: SecurityConfig,
  { type, securityScheme }: ResolvedSecurityScheme,
): Promise<void> {
  const value = await tokenPrompt(type === 'oauth2' ? 'OAuth2' : 'Bearer Token', securityScheme.description);
  const key = ctx.generateConfigKey('bearer token');
  userConfig[key] = value.trim().length === 0 ? ctx.generateConfigValue('bearer token') : value;
  (serverClientConfig.headers ??= {})['Authorization'] = `Bearer ${interpolable(key)}`;
}

// technically oauth2 may issue a different token type than bearer token,
// but that's less common
async function negotiateValuesForOauth2Scheme(
  ctx: Context,
  config: SecurityConfig,
  resolvedSecurityScheme: ResolvedSecurityScheme,
): Promise<void> {
  await negotiateBearerToken(ctx, config, resolvedSecurityScheme);
}

function allSupported(schemes: ResolvedSecurityScheme[]) {
  return schemes.every(s => s.supported);
}

function tokenPrompt(strategy: string, description: string | undefined) {
  return prompt.maskedText({
    message: `This API uses ${strategy} authentication, please insert a secret or leave empty to use an environment variable. The secret will be stored on your computer.`,
    help: description?.replace(/\n+/g, ' '),
  });
}
