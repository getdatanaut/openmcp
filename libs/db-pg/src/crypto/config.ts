import type { McpClientConfigSchemaSchema } from '@libs/schemas/mcp';
import type { z } from 'zod';

import type { AgentMcpServerConfig, EncryptedAgentMcpServerConfig } from '../tables/agent-mcp-servers/schema.ts';
import { decrypt } from './decrypt.ts';
import { encrypt } from './encrypt.ts';
import { isEncryptedPayload } from './guards.ts';

export async function encryptConfig({
  config,
  schema,
  secret,
}: {
  config: AgentMcpServerConfig;
  schema?: z.infer<typeof McpClientConfigSchemaSchema> | null;
  secret: string;
}) {
  const encryptedConfig = {} as EncryptedAgentMcpServerConfig;

  for (const key in config) {
    const value = config[key];
    if (value === undefined) continue;

    const property = schema?.properties?.[key];
    if (!property) {
      throw new Error(`Server config schema does not have a property defined for key: ${key}`);
    }

    const shouldEncrypt = schema?.properties?.[key]?.format === 'secret';
    if (shouldEncrypt && !isEncryptedPayload(value)) {
      encryptedConfig[key] = await encrypt(String(value), secret);
    } else {
      encryptedConfig[key] = value;
    }
  }

  return encryptedConfig;
}

export async function decryptConfig({ config, secret }: { config: EncryptedAgentMcpServerConfig; secret: string }) {
  const decryptedConfig: AgentMcpServerConfig = {};

  for (const [key, value] of Object.entries(config)) {
    if (isEncryptedPayload(value)) {
      decryptedConfig[key] = await decrypt(value, secret);
    } else {
      decryptedConfig[key] = value;
    }
  }

  return decryptedConfig;
}
