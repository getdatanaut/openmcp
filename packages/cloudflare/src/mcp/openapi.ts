import { createOpenAI } from '@ai-sdk/openai';
import { openApiToMcpServerOptions, type ServerConfig } from '@openmcp/openapi';
import { OpenMpcServer } from '@openmcp/server';

import { OpenMcpDurableObject } from '../durable-object.ts';
import type { SessionId } from '../utils/session.ts';

export type OpenMcpOpenAPIConfig = ServerConfig & {
  autoTrim: boolean;
  openAiApiKey?: string;
};

/**
 * Get the MCP Server configuration from the request
 * @param request Request to get the configuration from
 * @returns MCP Server configuration
 */
export function getOpenMcpOpenAPIConfig({ openAiApiKey }: { openAiApiKey?: string }) {
  return ({ request }: { request: Request }) => {
    const url = new URL(request.url);

    const autoTrimString = url.searchParams.get('autotrim') ?? 'false';
    if (autoTrimString && autoTrimString !== 'true' && autoTrimString !== 'false') {
      throw new Error('autotrim must be true or false');
    }

    const autoTrim = JSON.parse(autoTrimString);

    const openapi = url.searchParams.get('openapi') ?? undefined;

    // @TODO(CL): migrate baseUrl -> serverUrl
    const serverUrl = url.searchParams.get('serverUrl') ?? url.searchParams.get('baseUrl') ?? undefined;

    if (!openapi) {
      throw new Error('openapi is required');
    }

    if (autoTrim && !openAiApiKey) {
      throw new Error('openai api key is required when autoTrim is true');
    }

    return { autoTrim, openapi, serverUrl, openAiApiKey } satisfies OpenMcpOpenAPIConfig;
  };
}

/**
 * OpenAPI MCP DurableObject
 */
export class OpenMcpOpenAPI<
  Env = unknown,
  ServerConfig extends OpenMcpOpenAPIConfig = OpenMcpOpenAPIConfig,
> extends OpenMcpDurableObject<Env, ServerConfig, OpenMpcServer> {
  mpcServerType = 'openapi';

  override async createMcpServer({ config, sessionId }: { config: ServerConfig; sessionId: SessionId }) {
    const options = await openApiToMcpServerOptions(config, () => {
      // @TODO this does not seem correct, at least the typings are not (config is typed as ServerConfig here, but this is client right?)
      return this.getSession(sessionId)?.config ?? {};
    });

    return new OpenMpcServer({
      ...options,
      autoTrimToolResult: config.autoTrim
        ? {
            enabled: true,
            model: createOpenAI({ apiKey: config.openAiApiKey })('gpt-4o'),
          }
        : undefined,
    });
  }
}
