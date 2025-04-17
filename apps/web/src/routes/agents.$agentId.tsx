import { AgentId, McpServerId, McpToolId } from '@libs/db-ids';
import type { AgentMcpToolSummarySelect, McpToolSummarySelect } from '@libs/db-pg';
import { Button, ButtonGroup, Input, Tab, TabList, TabPanel, TabPanels, Tabs, tn } from '@libs/ui-primitives';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useCallback } from 'react';
import { z } from 'zod';

import { CanvasLayout } from '~/components/CanvasLayout.tsx';
import { ServerRow } from '~/components/ServerRow.tsx';
import { rpc } from '~/libs/rpc.ts';

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
  beforeLoad: ({ context: { queryClient }, params: { agentId } }) => {
    void queryClient.prefetchQuery(rpc.mcpServers.listWithTools.queryOptions());
    void queryClient.prefetchQuery(rpc.agentMcpServers.listWithTools.queryOptions({ input: { agentId } }));
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
  const { data: agent } = useSuspenseQuery(rpc.agents.get.queryOptions({ input: { id: agentId } }));

  return (
    <div className="flex h-48 shrink-0 items-center justify-center">
      <div className="font-bold">{agent.name}.. TODO Splash</div>
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
  const { agentId } = Route.useParams();
  const { serverId } = Route.useSearch();
  const queryClient = useQueryClient();

  const addTool = useMutation(
    rpc.agentMcpServers.addTool.mutationOptions({
      onSuccess: () => {
        return queryClient.invalidateQueries({
          queryKey: rpc.agentMcpServers.listWithTools.key({ input: { agentId } }),
        });
      },
    }),
  );

  const removeTool = useMutation(
    rpc.agentMcpServers.removeTool.mutationOptions({
      onSuccess: () => {
        return queryClient.invalidateQueries({
          queryKey: rpc.agentMcpServers.listWithTools.key({ input: { agentId } }),
        });
      },
    }),
  );

  const { data: servers } = useSuspenseQuery(rpc.mcpServers.listWithTools.queryOptions());
  const { data: agentServers } = useSuspenseQuery(
    rpc.agentMcpServers.listWithTools.queryOptions({ input: { agentId } }),
  );

  let installed: React.ReactNode[] = [];
  let notInstalled: React.ReactNode[] = [];

  const handleToolToggle = useCallback(
    ({ installedTool, tool }: { installedTool?: AgentMcpToolSummarySelect; tool: McpToolSummarySelect }) => {
      if (installedTool) {
        removeTool.mutate({ agentToolId: installedTool.id });
      } else {
        addTool.mutate({ agentId, toolId: tool.id });
      }
    },
    [addTool, agentId, removeTool],
  );

  for (const s of servers) {
    const { tools, ...server } = s;
    const agentServer = agentServers.find(agentServer => agentServer.mcpServerId === server.id);

    const elem = (
      <ServerRow
        key={server.id}
        server={server}
        tools={tools}
        installedServer={agentServer}
        installedTools={agentServer?.tools}
        isActive={serverId === server.id}
        handleToolToggle={handleToolToggle}
      />
    );
    if (agentServer) {
      installed.push(elem);
    } else {
      notInstalled.push(elem);
    }
  }

  if (!installed.length) {
    installed = [
      <div key="not-installed" className="flex h-12 items-center px-5">
        <div className="ak-text/50 text-sm">This agent has no installed servers.. add some below</div>
      </div>,
    ];
  }

  return (
    <div className="flex-1 divide-y pb-32">
      <div className="ak-layer-canvas-down-0.5 flex h-12 items-center px-5 font-bold">Installed</div>

      {installed}

      <div className="ak-layer-canvas-down-0.5 flex h-12 items-center px-5 font-bold">Available</div>

      {notInstalled}
    </div>
  );
}
