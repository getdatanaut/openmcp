import { ToolListChangedNotificationSchema } from '@modelcontextprotocol/sdk/types.js';

import type ScopedClientServer from './scoped-client-server.ts';

type Callback = (client: ScopedClientServer) => void;

export default function observeToolListChanged(clientServers: ScopedClientServer[], callback: Callback): () => void {
  const removeNotificationHandlers: (() => void)[] = [];
  for (const clientServer of clientServers) {
    const capabilities = clientServer.getServerCapabilities();
    if (capabilities?.tools?.listChanged) {
      clientServer.setNotificationHandler(ToolListChangedNotificationSchema, async () => {
        callback(clientServer);
      });

      removeNotificationHandlers.push(() => clientServer.removeNotificationHandler('notifications/tools/list_changed'));
    }
  }

  return () => {
    while (removeNotificationHandlers.length > 0) {
      removeNotificationHandlers.pop()!();
    }
  };
}
