import type { ClientServer, Tool } from '@openmcp/manager';
import { OpenMcpServer, type OpenMcpServerOptions, type ToolName } from '@openmcp/server';

import console from '#libs/console';

import type { Config } from './config/index.ts';
import type { RemixMcpManager } from './manager/remix-manager.ts';
import { createRemixMcpManager } from './manager/remix-manager.ts';

class RemixOpenMcpServer extends OpenMcpServer {
  #manager: RemixMcpManager;
  #tools: Record<ToolName, Tool> | null = null;
  readonly #toolsNameByClient = new WeakMap<ClientServer, ToolName[]>();

  constructor(options: OpenMcpServerOptions, manager: RemixMcpManager) {
    super(options);
    this.#manager = manager;
    super.setToolRequestHandlers();
    this.server.registerCapabilities({
      tools: {
        listChanged: true,
      },
    });
    this.#manager.observeToolListChanged(async clientServer => {
      if (this.#toolsNameByClient.has(clientServer)) {
        await this.#populateToolsForClientServer(clientServer);
        await this.server.sendToolListChanged();
      }
    });
  }

  protected override async getTools() {
    if (this.#tools === null) {
      await this.#populateTools();
    }

    return this.#tools!;
  }

  async #populateToolsForClientServer(clientServer: ClientServer) {
    let existingTools = this.#toolsNameByClient.get(clientServer);
    const tools = this.#tools || (this.#tools = {});
    if (existingTools) {
      while (existingTools.length > 0) {
        const toolName = existingTools.pop()!;
        delete tools[toolName];
      }
    } else {
      existingTools = [];
      this.#toolsNameByClient.set(clientServer, existingTools);
    }

    try {
      for (const tool of await clientServer.listTools()) {
        tools[tool.name] = tool;
        existingTools.push(tool.name);
      }
    } catch (error) {
      console.warn(`Error listing tools for client server "${clientServer.clientId}": ${error}`);
    }
  }

  async #populateTools() {
    let clientServers: ClientServer[];
    try {
      clientServers = await this.#manager.clientServers.findMany({ enabled: true });
    } catch (error) {
      console.warn('Error fetching client servers:', String(error));
      return;
    }

    await Promise.all(clientServers.map(async clientServer => this.#populateToolsForClientServer(clientServer)));
  }

  override async close(): Promise<void> {
    await Promise.allSettled([this.#manager.close(), await super.close()]);
  }
}

export default async function createRemixServer(
  options: Pick<OpenMcpServerOptions, 'name' | 'version'>,
  config: Config,
): Promise<RemixOpenMcpServer> {
  const manager = createRemixMcpManager({
    id: `${options.name}-${options.version}`,
    config,
  });
  await manager.registerServers();
  await manager.registerClientServers();
  return new RemixOpenMcpServer(options, manager);
}
