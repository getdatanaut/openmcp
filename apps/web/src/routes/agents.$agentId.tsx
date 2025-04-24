import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { AgentId, McpServerId, McpToolId, type TAgentId, type TMcpServerId } from '@libs/db-ids';
import { Button, Input, Tab, TabList, TabPanel, TabPanels, Tabs, tn } from '@libs/ui-primitives';
import { createFileRoute, Link, Navigate, retainSearchParams } from '@tanstack/react-router';
import { useCallback } from 'react';
import { z } from 'zod';

import { CanvasLayout } from '~/components/CanvasLayout.tsx';
import { ServerPanel } from '~/components/ServerPanel.tsx';
import { ServerRow } from '~/components/ServerRow.tsx';
import { ServerToolRow, type ServerToolRowProps } from '~/components/ServerToolRow.tsx';
import { useZeroMutation } from '~/hooks/use-zero-mutation.ts';
import { useZeroQuery } from '~/hooks/use-zero-query.ts';
import type { AgentMcpTool } from '~shared/zero-schema.ts';

export const Route = createFileRoute('/agents/$agentId')({
  component: RouteComponent,
  params: {
    parse: params => {
      return {
        agentId: AgentId.validator.parse(params.agentId),
      };
    },
  },
  validateSearch: z.object({
    agentTab: z.enum(['tools']).optional(),
    serverTab: z.enum(['tools', 'config']).optional(),
    serverId: McpServerId.validator.optional(),
  }),
  search: {
    middlewares: [retainSearchParams(['agentTab', 'serverTab', 'serverId'])],
  },
});

function RouteComponent() {
  const { agentTab } = Route.useSearch();

  return (
    <CanvasLayout className="overflow-y-auto">
      <ServersHeadingCard />
      <AgentTabs activeTab={agentTab} />
    </CanvasLayout>
  );
}

function ServersHeadingCard() {
  const { agentId } = Route.useParams();
  const [agent, agentDetails] = useZeroQuery(z => z.query.agents.where('id', agentId).one());

  if (!agent && agentDetails.type === 'complete') {
    // Not found or no access. Could do this better and redirect w query string back to current route after login if
    // this block is hit and user is not currently authenticated
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex h-48 shrink-0 items-center justify-center">
      <div className="font-bold">{agent?.name}.. TODO Splash</div>
    </div>
  );
}

function AgentTabs({ activeTab = 'root' }: { activeTab?: string }) {
  return (
    <div className="h-[calc(100dvh-var(--canvas-m)*2)] overflow-hidden py-2">
      <Tabs
        classNames={{
          tabInner: tn('flex gap-1.5 capitalize'),
          list: tn('shrink-0 border-b px-4'),
          panels: tn('h-full p-0'),
          panel: tn('flex h-full'),
        }}
        selectedId={activeTab}
        selectOnMove={false}
      >
        <TabList>
          <Tab id="root" render={<Link to="." search={prev => ({ ...prev, tab: undefined })} />}>
            MCP Servers
          </Tab>
        </TabList>

        <TabPanels>
          <TabPanel tabId="root" unmountOnHide>
            <div className="h-full flex-1 overflow-y-auto">
              <ServerFilters />
              <ServersList />
            </div>

            <ServerPanelWrapper />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  );
}

function ServerFilters() {
  return (
    <div className="ak-layer-0 sticky inset-x-0 top-0 z-10 flex h-16 shrink-0 items-center gap-3 border-b px-4">
      <Input placeholder="Search" size="sm" className="w-80" />
      <div className="text-sm">TODO filters...</div>
    </div>
  );
}

function ServersList() {
  return (
    <div className="flex-1 pb-16">
      <div className="ak-layer-canvas-down-0.5 flex h-10 items-center border-b px-5 font-bold">Installed</div>

      <InstalledServersList />

      <div className="ak-layer-canvas-down-0.5 flex h-10 items-center border-b px-5 font-bold">Available</div>

      <AvailableServersList />
    </div>
  );
}

function InstalledServersList() {
  const { agentId } = Route.useParams();
  const { serverId: activeServerId } = Route.useSearch();

  const [mcpServers] = useZeroQuery(z =>
    z.query.mcpServers.whereExists('agentMcpServers', q => q.where('agentId', '=', agentId)).orderBy('name', 'asc'),
  );

  if (!mcpServers.length) {
    return (
      <div className="flex shrink-0 items-center p-5">
        <div className="ak-text/50 text-sm">This agent has no installed servers.. add some below</div>
      </div>
    );
  }

  return mcpServers.map(server => (
    <ServerRow key={server.id} server={server} isActive={activeServerId === server.id} />
  ));
}

function AvailableServersList() {
  const { agentId } = Route.useParams();
  const { serverId: activeServerId } = Route.useSearch();

  const [mcpServers] = useZeroQuery(z =>
    z.query.mcpServers
      .where(({ not, exists }) => not(exists('agentMcpServers', q => q.where('agentId', '=', agentId))))
      .orderBy('name', 'asc'),
  );

  return mcpServers.map(server => (
    <ServerRow key={server.id} server={server} isActive={activeServerId === server.id} />
  ));
}

function ServerPanelWrapper() {
  const { serverId, serverTab } = Route.useSearch();
  const { agentId } = Route.useParams();

  const renderToolsList = useCallback(() => {
    if (!serverId) return null;

    return <ServerToolsList serverId={serverId} agentId={agentId} />;
  }, [serverId, agentId]);

  if (!serverId) return null;

  return <ServerPanel serverId={serverId} agentId={agentId} activeTab={serverTab} renderToolsList={renderToolsList} />;
}

function ServerToolsList({ serverId, agentId }: { serverId: TMcpServerId; agentId: TAgentId }) {
  const [installedTools] = useZeroQuery(z =>
    z.query.mcpTools
      .related('agentMcpTools', q => q.where('agentId', '=', agentId))
      .where(({ and, cmp, exists }) =>
        and(
          cmp('mcpServerId', '=', serverId),
          exists('agentMcpTools', q => q.where('agentId', '=', agentId)),
        ),
      )
      .orderBy('displayName', 'asc')
      .orderBy('name', 'asc'),
  );

  const [uninstalledTools] = useZeroQuery(z =>
    z.query.mcpTools
      .where(({ and, cmp, exists, not }) =>
        and(cmp('mcpServerId', '=', serverId), not(exists('agentMcpTools', q => q.where('agentId', '=', agentId)))),
      )
      .orderBy('displayName', 'asc')
      .orderBy('name', 'asc'),
  );

  return (
    <div className="flex flex-col gap-1">
      {installedTools.map(tool => (
        <ServerToolRowWrapper key={tool.id} tool={tool} agentTool={tool.agentMcpTools[0]} />
      ))}

      {uninstalledTools.map(tool => (
        <ServerToolRowWrapper key={tool.id} tool={tool} />
      ))}
    </div>
  );
}

function ServerToolRowWrapper({ tool, agentTool }: { tool: ServerToolRowProps['tool']; agentTool?: AgentMcpTool }) {
  const { agentId } = Route.useParams();
  const toolId = tool.id;
  const agentToolId = agentTool?.id;

  const { mutate: handleToggleTool } = useZeroMutation(
    z => {
      if (agentToolId) {
        return z.mutate.agentMcpTools.delete({ id: agentToolId });
      }

      return z.mutate.agentMcpTools.insert({ agentId, mcpToolId: toolId });
    },
    [toolId, agentId, agentToolId],
  );

  const actionElem = (
    <Button
      variant="soft"
      size="sm"
      intent={agentToolId ? 'danger' : 'primary'}
      icon={agentToolId ? faTrash : faPlus}
      title={agentToolId ? 'Remove tool from agent' : 'Add tool to agent'}
      onClick={handleToggleTool}
    />
  );

  return <ServerToolRow tool={tool} actionElem={actionElem} />;
}
