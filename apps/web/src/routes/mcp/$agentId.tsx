import { faCaretDown, faPlus, faSearch, faTrash } from '@fortawesome/free-solid-svg-icons';
import { AgentId, AgentMcpServerId, type TAgentId, type TAgentMcpServerId, type TMcpServerId } from '@libs/db-ids';
import { getInstallHints, type IntegrationName } from '@libs/host-utils/mcp';
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
import { escapeLike } from '@rocicorp/zero';
import { createFileRoute, Link, Navigate, retainSearchParams } from '@tanstack/react-router';
import { atom, useAtomState, useAtomValue } from '@zedux/react';
import { memo, useCallback, useMemo } from 'react';
import { z } from 'zod';

import { debouncedSearchParamAtom } from '~/atoms/debounced-search-param.ts';
import { injectLocalStorage } from '~/atoms/local-storage.ts';
import { CanvasCrumbs } from '~/components/CanvasCrumbs.tsx';
import { CanvasLayout } from '~/components/CanvasLayout.tsx';
import { useZeroMutation } from '~/hooks/use-zero-mutation.ts';
import { useZeroQuery } from '~/hooks/use-zero-query.ts';
import type { Agent, AgentMcpTool, McpTool } from '~shared/zero-schema.ts';

import { AgentsMenu } from './-components/AgentsMenu.tsx';
import type { ServerPanelProps } from './-components/ServerPanel.tsx';
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
    agentServerId: AgentMcpServerId.validator.optional(),
  }),
  search: {
    middlewares: [retainSearchParams(['agentTab', 'agentServerId'])],
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
  boltai: { name: 'BoltAI' },
  claude: { name: 'Claude Desktop' },
  cline: { name: 'Cline' },
  cursor: { name: 'Cursor' },
  roocode: { name: 'Roo Code' },
  vscode: { name: 'Visual Studio Code' },
  'vscode-insiders': { name: 'Visual Studio Code Insiders' },
  windsurf: { name: 'Windsurf' },
  witsy: { name: 'Witsy' },
} as const satisfies Record<IntegrationName, unknown>;

const serverInstallAtom = atom('serverInstall', () => {
  const signal = injectLocalStorage({
    key: 'serverInstall',
    defaultVal: {
      client: 'claude' as IntegrationName,
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
    (client: IntegrationName) => {
      setServerInstall({ client });
    },
    [setServerInstall],
  );

  const remix = useMemo(
    () =>
      ({
        id: agentId,
        name: agentName ?? 'Datanaut Agent',
      }) as const,
    [agentId, agentName],
  );
  const installHints = useMemo(() => getInstallHints(remix, client), [remix, client]);
  const commandText = installHints[0].value;
  const installLink = installHints.length === 2 ? installHints[1].value : undefined;

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

      {installLink ? (
        <Button
          size="sm"
          intent="primary"
          variant="soft"
          className="ml-auto"
          render={<a href={installLink} rel="noopener noreferrer" target="_blank" />}
        >
          Install
        </Button>
      ) : null}
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
  const [qServers, setQServers] = useAtomState(debouncedSearchParamAtom, [{ searchParam: 'qServers' }]);

  const handleSearchUpdate = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setQServers(event.target.value);
    },
    [setQServers],
  );

  return (
    <div className="ak-layer-0 sticky inset-x-0 top-0 z-10 flex h-16 shrink-0 items-center gap-3 border-b px-2">
      <Input
        placeholder="Search"
        className="w-80"
        startIcon={faSearch}
        variant="unstyled"
        value={qServers}
        onChange={handleSearchUpdate}
      />
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
  const { activeServerId } = Route.useSearch({ select: s => ({ activeServerId: s.agentServerId }) });

  const qServers = useAtomValue(debouncedSearchParamAtom, [{ searchParam: 'qServers' }]);
  const isSearching = qServers.trim().length > 2;

  const [servers, serversDetails] = useZeroQuery(z => {
    let q = z.query.agentMcpServers.related('mcpServer');

    if (isSearching) {
      q = q.whereExists('mcpServer', mcpServer =>
        mcpServer.where(({ or, cmp }) =>
          or(
            cmp('name', 'ILIKE', `%${escapeLike(qServers)}%`),
            cmp('summary', 'ILIKE', `%${escapeLike(qServers)}%`),
            cmp('description', 'ILIKE', `%${escapeLike(qServers)}%`),
          ),
        ),
      );
    }

    return q;
  });

  let content;
  if (servers.length) {
    const sortedServers = servers.sort((a, b) => a.mcpServer!.name.localeCompare(b.mcpServer!.name));
    content = sortedServers.map(server => (
      <ServerRow
        key={server.id}
        server={server.mcpServer!}
        agentServerId={server.id}
        isActive={server.id === activeServerId}
      />
    ));
  } else {
    content = (
      <div className="flex shrink-0 items-center border-b p-5">
        <div className="ak-text/50 text-sm">
          {serversDetails.type === 'complete'
            ? isSearching
              ? `No servers found matching "${qServers}"`
              : 'This remix has no installed servers.. add some below'
            : 'Loading...'}
        </div>
      </div>
    );
  }

  return content;
}

function AvailableServersList() {
  const { activeServerId, agentServerId } = Route.useSearch({
    select: s => ({ activeServerId: s.serverId, agentServerId: s.agentServerId }),
  });

  const qServers = useAtomValue(debouncedSearchParamAtom, [{ searchParam: 'qServers' }]);
  const isSearching = qServers.trim().length > 2;

  const [servers, serversDetails] = useZeroQuery(z => {
    let q = z.query.mcpServers.orderBy('name', 'asc').limit(25);

    if (isSearching) {
      q = q.where(({ or, cmp }) =>
        or(
          cmp('name', 'ILIKE', `%${escapeLike(qServers)}%`),
          cmp('summary', 'ILIKE', `%${escapeLike(qServers)}%`),
          cmp('description', 'ILIKE', `%${escapeLike(qServers)}%`),
        ),
      );
    }

    return q;
  });

  let content;
  if (servers.length) {
    content = servers.map(server => (
      <ServerRow key={server.id} server={server} isActive={server.id === activeServerId && !agentServerId} />
    ));
  } else {
    content = (
      <div className="flex shrink-0 items-center border-b p-5">
        <div className="ak-text/50 text-sm">
          {serversDetails.type === 'complete'
            ? isSearching
              ? `No servers found matching "${qServers}"`
              : 'No servers found'
            : 'Loading...'}
        </div>
      </div>
    );
  }

  return content;
}

function ServerPanelWrapper() {
  const { agentId } = Route.useParams();
  const { serverId, serverTab, agentServerId } = Route.useSearch({
    select: s => ({ serverId: s.serverId, serverTab: s.serverTab, agentServerId: s.agentServerId }),
  });

  const renderToolsList = useCallback<ServerPanelProps['renderToolsList']>(cbProps => {
    return <ServerToolsList serverId={cbProps.serverId} agentServerId={cbProps.agentServerId} />;
  }, []);

  if (!serverId && !agentServerId) return null;

  return (
    <div className="ak-layer-0.4 sticky inset-y-0 right-0 h-[var(--canvas-h)] w-3/5 overflow-y-auto border-l">
      <ServerPanel
        serverId={serverId}
        agentId={agentId}
        agentServerId={agentServerId}
        activeTab={serverTab}
        renderToolsList={renderToolsList}
      />
    </div>
  );
}

function ServerToolsList({ serverId, agentServerId }: { serverId: TMcpServerId; agentServerId?: TAgentMcpServerId }) {
  const [agentTools] = useZeroQuery(
    z =>
      z.query.agentMcpTools.where(
        'agentMcpServerId',
        'IS',
        // @ts-expect-error type issue that will be fixed by zero soon
        agentServerId,
      ),
    { enabled: !!agentServerId },
  );

  const [allTools] = useZeroQuery(z =>
    z.query.mcpTools.where('mcpServerId', '=', serverId).orderBy('displayName', 'asc').orderBy('name', 'asc'),
  );

  const agentToolsMap = new Map(agentTools.map(tool => [tool.mcpToolId, tool]));

  const installedTools: { tool: McpTool; agentMcpTool: AgentMcpTool }[] = [];
  const availableTools: { tool: McpTool; agentMcpTool?: AgentMcpTool }[] = [];

  for (const tool of allTools) {
    if (agentToolsMap.has(tool.id)) {
      installedTools.push({ tool, agentMcpTool: agentToolsMap.get(tool.id)! });
    } else {
      availableTools.push({ tool });
    }
  }

  return (
    <div className="flex flex-col gap-1">
      {installedTools.map(({ tool, agentMcpTool }) => (
        <ServerToolRowWrapper key={tool.id} tool={tool} agentTool={agentMcpTool} />
      ))}

      {availableTools.map(({ tool }) => (
        <ServerToolRowWrapper key={tool.id} tool={tool} />
      ))}
    </div>
  );
}

const ServerToolRowWrapper = memo(function ServerToolRowWrapper({
  tool,
  agentTool,
}: {
  tool: ServerToolRowProps['tool'];
  agentTool?: AgentMcpTool;
}) {
  const { agentId } = Route.useParams();
  const { agentServerId } = Route.useSearch({ select: s => ({ agentServerId: s.agentServerId }) });
  const navigate = Route.useNavigate();

  const toolId = tool.id;
  const serverId = tool.mcpServerId;
  const agentToolId = agentTool?.id;

  const { mutate: handleToggleTool } = useZeroMutation(
    async z => {
      if (agentToolId) {
        return {
          op: z.mutate.agentMcpTools.delete({ id: agentToolId }),
        };
      }

      let finalAgentServerId = agentServerId;
      if (!finalAgentServerId) {
        finalAgentServerId = AgentMcpServerId.generate();
        await z.mutate.agentMcpServers.insert({ id: finalAgentServerId, agentId, mcpServerId: serverId });
      }

      return {
        op: z.mutate.agentMcpTools.insert({ mcpToolId: toolId, agentMcpServerId: finalAgentServerId }),
        onClientSuccess() {
          if (!agentServerId) {
            void navigate({ to: '.', search: prev => ({ ...prev, serverId, agentServerId: finalAgentServerId }) });
          }
        },
      };
    },
    [toolId, agentId, navigate, serverId, agentServerId, agentToolId],
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
});
