import { ToolListChangedNotificationSchema } from '@modelcontextprotocol/sdk/types.js';
import { McpManager, type McpManagerOptions } from '@openmcp/manager';

import console from '#libs/console';

import type { Config } from '../config/index.ts';
import { registerClientServers } from './client-servers/index.ts';
import type ScopedClientServer from './client-servers/scoped-client-server.ts';
import { registerServers } from './servers/index.ts';

export interface RemixMcpManagerOptions extends McpManagerOptions {
  config: Config;
}

export function createRemixMcpManager(options: RemixMcpManagerOptions) {
  return new RemixMcpManager(options);
}

export class RemixMcpManager extends McpManager {
  readonly #config: Config;
  readonly #registeredClientServers: ScopedClientServer[] = [];
  readonly #disposeObservers: (() => void)[] = [];

  constructor(options: RemixMcpManagerOptions) {
    super({
      id: options.id,
      storage: options.storage,
    });

    this.#config = options.config;
  }

  override async close() {
    while (this.#disposeObservers.length > 0) {
      this.#disposeObservers.pop()!();
    }

    this.#registeredClientServers.length = 0;
    return super.close();
  }

  public async registerServers() {
    try {
      await registerServers(this, this.#config);
    } catch (error) {
      console.error('Error registering servers:', String(error));
      throw error;
    }
  }

  public async registerClientServers() {
    try {
      this.#registeredClientServers.push(...(await registerClientServers(this, this.#config)));
    } catch (error) {
      console.error('Error registering client servers:', String(error));
      throw error;
    }
  }

  public observeToolListChanged(callback: (clientServer: ScopedClientServer) => void) {
    for (const clientServer of this.#registeredClientServers) {
      const capabilities = clientServer.getServerCapabilities();
      if (capabilities?.tools?.listChanged) {
        clientServer.setNotificationHandler(ToolListChangedNotificationSchema, async () => {
          callback(clientServer);
        });

        this.#disposeObservers.push(() => clientServer.removeNotificationHandler('notifications/tools/list_changed'));
      }
    }
  }
}
