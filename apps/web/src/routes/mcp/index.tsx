import { faCaretDown, faPlus, faSearch, faTrash } from '@fortawesome/free-solid-svg-icons';
import { type TMcpServerId } from '@libs/db-ids';
import { Button, Input } from '@libs/ui-primitives';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useCallback } from 'react';

import { CanvasCrumbs } from '~/components/CanvasCrumbs.tsx';
import { CanvasLayout } from '~/components/CanvasLayout.tsx';
import { useZeroQuery } from '~/hooks/use-zero-query.ts';

import { AgentsMenu } from './-components/AgentsMenu.tsx';
import { ServerPanel } from './-components/ServerPanel.tsx';
import { ServerRow } from './-components/ServerRow.tsx';
import { ServerToolRow, type ServerToolRowProps } from './-components/ServerToolRow.tsx';

export const Route = createFileRoute('/mcp/')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <CanvasLayout header={<CanvasHeader />} className="overflow-y-auto">
      <ServersHeadingCard />

      <div className="flex">
        <div className="flex-1">
          <ServerFilters />
          <ServersList />
        </div>

        <ServerPanelWrapper />
      </div>
    </CanvasLayout>
  );
}

function CanvasHeader() {
  const navigate = Route.useNavigate();

  const agentsMenu = (
    <AgentsMenu
      trigger={
        <Button variant="unstyled" endIcon={faCaretDown}>
          Select a Remix
        </Button>
      }
      onSelect={agentId => navigate({ to: '/mcp/$agentId', params: { agentId } })}
    />
  );

  return <CanvasCrumbs items={[<Link to="/mcp">MCP</Link>, agentsMenu]} />;
}

function ServersHeadingCard() {
  return <div className="flex h-48 shrink-0 items-center justify-center border-b">TODO Splash</div>;
}

function ServerFilters() {
  return (
    <div className="ak-layer-0 sticky inset-x-0 top-0 z-10 flex h-16 shrink-0 items-center gap-3 border-b px-2">
      <Input placeholder="Search" className="w-80" startIcon={faSearch} variant="unstyled" />
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

  return (
    <div className="ak-layer-0.4 sticky inset-y-0 right-0 h-[var(--canvas-h)] w-3/5 overflow-y-auto border-l">
      <ServerPanel serverId={serverId} activeTab={serverTab} renderToolsList={renderToolsList} />
    </div>
  );
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
