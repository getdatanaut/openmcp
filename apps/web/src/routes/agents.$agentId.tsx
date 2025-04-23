import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import {
  AgentId,
  McpServerId,
  McpToolId,
  type TAgentId,
  type TAgentMcpServerId,
  type TMcpServerId,
} from '@libs/db-ids';
import { Button, ButtonGroup, Input, Tab, TabList, TabPanel, TabPanels, Tabs, tn } from '@libs/ui-primitives';
import { createFileRoute, Link, Navigate } from '@tanstack/react-router';
import { z } from 'zod';

import { CanvasLayout } from '~/components/CanvasLayout.tsx';
import { ServerRow, type ServerRowProps } from '~/components/ServerRow.tsx';
import { ServerRowTools } from '~/components/ServerRowTools.tsx';
import { ServerToolRow, type ServerToolRowProps } from '~/components/ServerToolRow.tsx';
import { useMutation } from '~/hooks/use-mutation.ts';
import { useQuery } from '~/hooks/use-query.ts';
import type { AgentMcpServer, AgentMcpTool } from '~shared/zero-schema.ts';

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
    serverId: McpServerId.validator.optional(),
    toolId: McpToolId.validator.optional(),
  }),
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
  const [agent, agentDetails] = useQuery(z => z.query.agents.where('id', agentId).one());

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
    <Tabs
      classNames={{
        tabInner: tn('flex gap-1.5 capitalize'),
        list: tn('shrink-0 border-b px-4'),
        panels: tn('h-full p-0'),
        panel: tn('h-full'),
      }}
      selectedId={activeTab}
      selectOnMove={false}
    >
      <TabList>
        <Tab id="root" render={<Link to="." search={prev => ({ ...prev, tab: undefined })} />}>
          Tools
        </Tab>
      </TabList>

      <TabPanels>
        <TabPanel tabId="root" unmountOnHide>
          <ServerFilters />
          <ServersList />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}

function ServerFilters() {
  return (
    <div className="flex h-16 shrink-0 items-center gap-3 border-b px-4">
      <Input placeholder="Search" size="sm" />
      <ButtonGroup isAttached size="sm" variant="outline">
        <Button data-active={true}>All</Button>
        <Button>Installed</Button>
        <Button>Not installed</Button>
      </ButtonGroup>
    </div>
  );
}

function ServersList() {
  return (
    <div className="flex-1 divide-y pb-32">
      <div className="ak-layer-canvas-down-0.5 flex h-12 items-center px-5 font-bold">Installed</div>

      <InstalledServersList />

      <div className="ak-layer-canvas-down-0.5 flex h-12 items-center px-5 font-bold">Available</div>

      <AvailableServersList />
    </div>
  );
}

function InstalledServersList() {
  const { agentId } = Route.useParams();
  const { serverId: activeServerId } = Route.useSearch();

  const [mcpServers] = useQuery(z =>
    z.query.mcpServers
      .related('agentMcpServers', q => q.where('agentId', '=', agentId))
      .whereExists('agentMcpServers', q => q.where('agentId', '=', agentId))
      .orderBy('name', 'asc'),
  );

  if (!mcpServers.length) {
    return (
      <div className="flex h-12 items-center px-5">
        <div className="ak-text/50 text-sm">This agent has no installed servers.. add some below</div>
      </div>
    );
  }

  return (
    <>
      {mcpServers.map(({ agentMcpServers, ...server }) => (
        <ServerRowWrapper
          key={server.id}
          server={server}
          agentServer={agentMcpServers[0]}
          isActive={activeServerId === server.id}
        />
      ))}
    </>
  );
}

function AvailableServersList() {
  const { agentId } = Route.useParams();
  const { serverId: activeServerId } = Route.useSearch();

  const [mcpServers] = useQuery(z =>
    z.query.mcpServers
      .where(({ not, exists }) => not(exists('agentMcpServers', q => q.where('agentId', '=', agentId))))
      .orderBy('name', 'asc'),
  );

  return (
    <>
      {mcpServers.map(server => (
        <ServerRowWrapper key={server.id} server={server} isActive={activeServerId === server.id} />
      ))}
    </>
  );
}

function ServerRowWrapper({
  server,
  agentServer,
  isActive,
}: {
  server: ServerRowProps['server'];
  agentServer?: AgentMcpServer;
  isActive: boolean;
}) {
  const { agentId } = Route.useParams();

  return (
    <ServerRow server={server} isActive={isActive}>
      {isActive ? <ServerToolsList serverId={server.id} agentId={agentId} agentServerId={agentServer?.id} /> : null}
    </ServerRow>
  );
}

function ServerToolsList({
  serverId,
  agentId,
  agentServerId,
}: {
  serverId: TMcpServerId;
  agentId: TAgentId;
  agentServerId?: TAgentMcpServerId;
}) {
  const [installedTools] = useQuery(
    z =>
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
    { enabled: !!agentServerId },
  );

  const [uninstalledTools] = useQuery(z =>
    z.query.mcpTools
      .where(({ and, cmp, exists, not }) =>
        and(
          cmp('mcpServerId', '=', serverId),
          agentServerId ? not(exists('agentMcpTools', q => q.where('agentId', '=', agentId))) : undefined,
        ),
      )
      .orderBy('displayName', 'asc')
      .orderBy('name', 'asc'),
  );

  let toolsListElem: React.ReactNode;
  if (installedTools.length || uninstalledTools.length) {
    toolsListElem = (
      <ServerRowTools>
        {installedTools.map(tool => (
          <ServerToolRowWrapper key={tool.id} tool={tool} agentTool={tool.agentMcpTools[0]} />
        ))}

        {uninstalledTools.map(tool => (
          <ServerToolRowWrapper key={tool.id} tool={tool} />
        ))}
      </ServerRowTools>
    );
  }

  return toolsListElem;
}

function ServerToolRowWrapper({ tool, agentTool }: { tool: ServerToolRowProps['tool']; agentTool?: AgentMcpTool }) {
  const { agentId } = Route.useParams();
  const toolId = tool.id;
  const agentToolId = agentTool?.id;

  const { mutate: handleToggleTool } = useMutation(
    z => {
      if (agentToolId) {
        return z.mutate.agentMcpTools.delete({ id: agentToolId });
      } else {
        return z.mutate.agentMcpTools.insert({ agentId, mcpToolId: toolId });
      }
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
