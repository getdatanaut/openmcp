import { inferTargetType } from '#libs/mcp-utils';

import { resolveConfigPath } from '../config/index.ts';
import type { Context, FsInstallMethod, InstallMethod, McpHostClient, Server } from '../types.ts';
import createGenericClient from './generic.ts';
import generateDefinitionWorkspacePath from './utils/generate-definition-workspace-path.ts';
import unwrapMatchingInstallMethod from './utils/uwrap-matching-install-method.ts';

export default function createCursorClient(): McpHostClient<FsInstallMethod[]> {
  const client = createGenericClient('cursor', {
    global: '$HOME/.cursor/mcp.json',
    local: '$CWD/.cursor/mcp.json',
  });

  return {
    name: client.name,
    installMethods: client.installMethods,
    install(ctx, server, location) {
      if (location === 'local' || location === 'prefer-local') {
        return client.install(ctx, resolveServer(ctx, client.installMethods, server), location);
      }

      return client.install(ctx, server, location);
    },
    uninstall(ctx, server, location) {
      if (location === 'local' || location === 'prefer-local') {
        return client.uninstall(ctx, resolveServer(ctx, client.installMethods, server), location);
      }

      return client.uninstall(ctx, server, location);
    },
  };
}

function resolveServer<S extends Server>(ctx: Context, installMethods: InstallMethod[], server: S): S {
  const installMethod = unwrapMatchingInstallMethod(installMethods, server, 'local');
  const resolvedPath = resolveConfigPath(ctx.constants, installMethod.filepath);
  if (inferTargetType(server.target) !== 'openapi') {
    return server;
  }

  return {
    ...server,
    target: generateDefinitionWorkspacePath('${workspaceFolder}/.cursor', resolvedPath, server.target),
  };
}
