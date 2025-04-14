import { ClientServer, type ClientServerOptions, type ClientServerStorageData, type Tool } from '@openmcp/manager';

import { resolveToolName } from '../utils/tools.ts';

export default class ScopedClientServer extends ClientServer {
  readonly #allowedTools: string[] = [];

  constructor(data: ClientServerStorageData, options: ClientServerOptions, allowedTools: string[]) {
    super(data, options);
    this.#allowedTools = allowedTools;
  }

  override async listTools(): Promise<Tool[]> {
    const tools = await super.listTools({ lazyConnect: true });
    const exposedToolNames = new Set<string>();
    const exposedTools: Tool[] = [];
    for (const tool of tools) {
      if (!this.#allowedTools.includes(tool.name)) continue;

      const resolvedToolName = resolveToolName(this.serverId, tool.name);
      if (exposedToolNames.has(tool.name)) {
        // todo: we could try to handle it by renaming the tool
        throw new Error(`Tool name collision: ${tool.name} and ${resolvedToolName}`);
      }

      exposedToolNames.add(resolvedToolName);
      exposedTools.push({
        ...tool,
        name: resolvedToolName,
      });
    }

    return exposedTools;
  }
}
