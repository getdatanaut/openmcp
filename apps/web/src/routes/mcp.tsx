import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { McpServerId, McpToolId } from '@libs/db-ids';
import { Button, Input } from '@libs/ui-primitives';
import { createFileRoute } from '@tanstack/react-router';
import { Suspense } from 'react';
import { z } from 'zod';

import { CanvasLayout } from '~/components/CanvasLayout.tsx';
import { ServerRow, type ServerRowProps } from '~/components/ServerRow.tsx';
import { ServerRowTools } from '~/components/ServerRowTools.tsx';
import { ServerToolRow, type ServerToolRowProps } from '~/components/ServerToolRow.tsx';
import { useZeroQuery } from '~/hooks/use-zero-query.ts';

export const Route = createFileRoute('/mcp')({
  component: RouteComponent,
  validateSearch: z.object({
    serverId: McpServerId.validator.optional(),
    toolId: McpToolId.validator.optional(),
  }),
});

function RouteComponent() {
  return (
    <CanvasLayout className="overflow-y-auto" contentClassName="divide-y">
      <ServersHeadingCard />

      <ServerFilters />

      <Suspense fallback={<div>Loading...</div>}>
        <ServersList />
      </Suspense>
    </CanvasLayout>
  );
}

function ServersHeadingCard() {
  return <div className="flex h-48 shrink-0 items-center justify-center">TODO Splash</div>;
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
    content = servers.map(server => (
      <ServerRowWrapper key={server.id} server={server} isActive={server.id === serverId} />
    ));
  } else {
    content = <div>No servers found</div>;
  }

  return <div className="flex-1 divide-y pb-32">{content}</div>;
}

function ServerRowWrapper({ server, isActive }: { server: ServerRowProps['server']; isActive: boolean }) {
  const [tools] = useZeroQuery(
    z => z.query.mcpTools.orderBy('displayName', 'asc').orderBy('name', 'asc').where('mcpServerId', '=', server.id),
    {
      enabled: isActive,
    },
  );

  let toolsListElem: React.ReactNode;
  if (tools.length) {
    toolsListElem = (
      <ServerRowTools>
        {tools.map(tool => (
          <ServerToolRowWrapper key={tool.id} tool={tool} />
        ))}
      </ServerRowTools>
    );
  }

  return (
    <ServerRow server={server} isActive={isActive}>
      {toolsListElem}
    </ServerRow>
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
