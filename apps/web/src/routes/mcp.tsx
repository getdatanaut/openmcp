import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { McpServerId, type TMcpServerId } from '@libs/db-ids';
import { Button, Input } from '@libs/ui-primitives';
import { createFileRoute, retainSearchParams } from '@tanstack/react-router';
import { useCallback } from 'react';
import { z } from 'zod';

import { CanvasLayout } from '~/components/CanvasLayout.tsx';
import { ServerPanel } from '~/components/ServerPanel.tsx';
import { ServerRow } from '~/components/ServerRow.tsx';
import { ServerToolRow, type ServerToolRowProps } from '~/components/ServerToolRow.tsx';
import { useZeroQuery } from '~/hooks/use-zero-query.ts';

export const Route = createFileRoute('/mcp')({
  component: RouteComponent,
  validateSearch: z.object({
    serverTab: z.enum(['tools', 'config']).optional(),
    serverId: McpServerId.validator.optional(),
  }),
  search: {
    middlewares: [retainSearchParams(['serverTab', 'serverId'])],
  },
});

function RouteComponent() {
  return (
    <CanvasLayout className="overflow-y-auto">
      <ServersHeadingCard />

      <div className="flex h-[calc(100dvh-var(--canvas-m)*2)] overflow-hidden">
        <div className="h-full flex-1 overflow-y-auto">
          <ServerFilters />
          <ServersList />
        </div>

        <ServerPanelWrapper />
      </div>
    </CanvasLayout>
  );
}

function ServersHeadingCard() {
  return <div className="flex h-48 shrink-0 items-center justify-center border-b">TODO Splash</div>;
}

function ServerFilters() {
  return (
    <div className="flex h-16 shrink-0 items-center gap-3 border-b px-4">
      <Input placeholder="Search" size="sm" />
      <div className="text-sm">TODO filters...</div>
    </div>
  );
}

function ServersList() {
  const { serverId } = Route.useSearch();

  const [servers] = useZeroQuery(z => z.query.mcpServers.orderBy('name', 'asc'));

  let content;
  if (servers.length) {
    content = servers.map(server => <ServerRow key={server.id} server={server} isActive={server.id === serverId} />);
  } else {
    content = <div>No servers found</div>;
  }

  return <div className="flex-1 pb-16">{content}</div>;
}

function ServerPanelWrapper() {
  const { serverId, serverTab } = Route.useSearch();

  const renderToolsList = useCallback(() => {
    if (!serverId) return null;

    return <ServerToolsList serverId={serverId} />;
  }, [serverId]);

  if (!serverId) return null;

  return <ServerPanel serverId={serverId} activeTab={serverTab} renderToolsList={renderToolsList} />;
}

function ServerToolsList({ serverId }: { serverId: TMcpServerId }) {
  const [tools] = useZeroQuery(z =>
    z.query.mcpTools.where('mcpServerId', serverId).orderBy('displayName', 'asc').orderBy('name', 'asc'),
  );

  return (
    <div className="flex flex-col gap-1">
      {tools.map(tool => (
        <ServerToolRowWrapper key={tool.id} tool={tool} />
      ))}
    </div>
  );
}

function ServerToolRowWrapper({ tool }: { tool: ServerToolRowProps['tool'] }) {
  const installedTool = false;

  const actionElem = (
    <Button
      variant="soft"
      size="sm"
      intent={installedTool ? 'danger' : 'primary'}
      icon={installedTool ? faTrash : faPlus}
      title={installedTool ? 'Remove tool from agent' : 'Add tool to agent'}
    />
  );

  return <ServerToolRow tool={tool} actionElem={actionElem} />;
}
