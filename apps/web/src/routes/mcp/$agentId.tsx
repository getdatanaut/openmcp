import { faCaretDown, faPlus, faSearch, faTrash } from '@fortawesome/free-solid-svg-icons';
import { AgentId, type TAgentId, type TMcpServerId } from '@libs/db-ids';
import {
  Button,
  CopyButton,
  Input,
  Select,
  SelectItem,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  tn,
  twMerge,
} from '@libs/ui-primitives';
import { createFileRoute, Link, Navigate, retainSearchParams } from '@tanstack/react-router';
import { atom, useAtomState } from '@zedux/react';
import { useCallback } from 'react';
import { z } from 'zod';

import { injectLocalStorage } from '~/atoms/local-storage.ts';
import { CanvasCrumbs } from '~/components/CanvasCrumbs.tsx';
import { CanvasLayout } from '~/components/CanvasLayout.tsx';
import { useZeroMutation } from '~/hooks/use-zero-mutation.ts';
import { useZeroQuery } from '~/hooks/use-zero-query.ts';
import type { Agent, AgentMcpTool } from '~shared/zero-schema.ts';

import { AgentsMenu } from './-components/AgentsMenu.tsx';
import { ServerPanel } from './-components/ServerPanel.tsx';
import { ServerRow } from './-components/ServerRow.tsx';
import { ServerToolRow, type ServerToolRowProps } from './-components/ServerToolRow.tsx';

export const Route = createFileRoute('/mcp/$agentId')({
  component: RouteComponent,
  params: {
    parse: params => ({
      agentId: AgentId.validator.parse(params.agentId),
    }),
  },
  validateSearch: z.object({
    agentTab: z.enum(['tools']).optional(),
  }),
  search: {
    middlewares: [retainSearchParams(['agentTab'])],
  },
});

function RouteComponent() {
  const { agentTab } = Route.useSearch();
  const { agentId } = Route.useParams();
  const [agent, agentDetails] = useZeroQuery(z => z.query.agents.where('id', agentId).one());

  if (!agent && agentDetails.type === 'complete') {
    // Not found or no access. Could do this better and redirect w query string back to current route after login if
    // this block is hit and user is not currently authenticated
    return <Navigate to="/mcp" replace />;
  }

  return (
    <CanvasLayout header={<CanvasHeader agentId={agentId} agentName={agent?.name} />} className="overflow-y-auto">
      <ServersHeadingCard agentId={agentId} agent={agent} />
      <AgentTabs activeTab={agentTab} />
    </CanvasLayout>
  );
}

function CanvasHeader({ agentId, agentName }: { agentId: TAgentId; agentName?: string }) {
  const navigate = Route.useNavigate();

  const agentsMenu = (
    <AgentsMenu
      trigger={
        <Button variant="unstyled" endIcon={faCaretDown}>
          {agentName}
        </Button>
      }
      activeAgentId={agentId}
      onSelect={agentId => navigate({ to: '/mcp/$agentId', params: { agentId } })}
    />
  );

  return <CanvasCrumbs items={[<Link to="/mcp">MCP</Link>, agentsMenu]} />;
}

function ServersHeadingCard({ agentId, agent }: { agentId: TAgentId; agent?: Pick<Agent, 'name'> }) {
  return (
    <div className="flex shrink-0 px-6 pt-10 pb-8">
      <InstallationCard agentId={agentId} agentName={agent?.name} className="mx-auto" />
    </div>
  );
}

const INSTALL_CLIENTS = {
  claude: {
    name: 'Claude Desktop',
  },
  cursor: {
    name: 'Cursor',
  },
} as const;

const serverInstallAtom = atom('serverInstall', () => {
  const signal = injectLocalStorage({
    key: 'serverInstall',
    defaultVal: {
      client: 'claude',
    },
  });

  return signal;
});

function InstallationCard({
  agentId,
  agentName,
  className,
}: {
  agentId: TAgentId;
  agentName?: string;
  className?: string;
}) {
  const [{ client }, setServerInstall] = useAtomState(serverInstallAtom);

  const updateClient = useCallback(
    (client: string) => {
      setServerInstall({ client });
    },
    [setServerInstall],
  );

  const commandText = `npx @openmcp/cli@latest install ${agentId} --client ${client}`;

  const selectElem = (
    <Select
      value={client}
      displayValue={`${INSTALL_CLIENTS[client]?.name}`}
      onChange={updateClient}
      variant="unstyled"
      renderInline
    >
      {Object.entries(INSTALL_CLIENTS).map(([id, { name }]) => (
        <SelectItem value={id} key={id}>
          {name}
        </SelectItem>
      ))}
    </Select>
  );

  return (
    <div className={twMerge('ak-layer-0.5 flex flex-col gap-3 rounded-xs border p-3', className)}>
      <div className="pr-5 pl-1 text-sm">
        Use the {agentName} remix with <b>{selectElem}</b> by running the following command:
      </div>

      <Input
        value={commandText}
        size="sm"
        readOnly
        endSection={<CopyButton size="xs" variant="soft" copyText={commandText} input className="mr-1 ml-2" />}
      />
    </div>
  );
}

function AgentTabs({ activeTab = 'root' }: { activeTab?: string }) {
  return (
    <Tabs
      classNames={{
        tabInner: tn('flex gap-1.5 capitalize'),
        panel: tn('flex h-full'),
      }}
      selectedId={activeTab}
      selectOnMove={false}
    >
      <TabList className="shrink-0 border-b px-4">
        <Tab id="root" render={<Link to="." search={prev => ({ ...prev, tab: undefined })} />}>
          MCP Servers
        </Tab>
      </TabList>

      <TabPanels className="p-0">
        <TabPanel tabId="root" unmountOnHide>
          <div className="flex-1">
            <ServerFilters />
            <ServersList />
          </div>

          <ServerPanelWrapper />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}

function ServerFilters() {
  return (
    <div className="ak-layer-0 sticky inset-x-0 top-0 z-10 flex h-16 shrink-0 items-center gap-3 border-b px-2">
      <Input placeholder="Search" className="w-80" startIcon={faSearch} variant="unstyled" />
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
      <div className="flex shrink-0 items-center border-b p-5">
        <div className="ak-text/50 text-sm">This remix has no installed servers.. add some below</div>
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

  return (
    <div className="ak-layer-0.4 sticky inset-y-0 right-0 h-[var(--canvas-h)] w-3/5 overflow-y-auto border-l">
      <ServerPanel serverId={serverId} agentId={agentId} activeTab={serverTab} renderToolsList={renderToolsList} />
    </div>
  );
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
