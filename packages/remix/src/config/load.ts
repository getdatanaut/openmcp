import parseConfig from './parse.ts';
import type { Config } from './schemas.ts';

function isEnvVar(value: unknown): value is string {
  return typeof value === 'string' && /^\$[A-Z_]+$/.test(value);
}

function resolve(clientConfig: Record<string, unknown>, env: Record<string, unknown>): Record<string, unknown> {
  const resolvedClientConfig = { ...clientConfig };
  for (const [key, value] of Object.entries(resolvedClientConfig)) {
    if (!isEnvVar(value)) {
      continue;
    }

    const envVarName = value.slice(1);
    if (!Object.hasOwn(env, envVarName)) {
      throw new Error(`Environment variable ${value} is not defined. Please define it before running the command.`);
    }

    resolvedClientConfig[key] = env[envVarName];
  }

  return resolvedClientConfig;
}

export default function load(maybeConfig: unknown, env: Record<string, unknown>): Config {
  const config = { ...parseConfig(maybeConfig) };
  const configs = { ...config.configs };
  config.configs = configs;
  for (const [key, value] of Object.entries(configs)) {
    configs[key] = resolve(value, env);
  }

  return config;
}
