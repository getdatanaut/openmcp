import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { McpServerId, type TMcpServerId } from '@libs/db-ids';
import type { McpToolSummarySelect } from '@libs/db-pg';
import { Button, Tab, TabList, TabPanel, TabPanels, Tabs, tn } from '@libs/ui-primitives';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { z } from 'zod';

import { CanvasLayout } from '~/components/CanvasLayout.tsx';
import { rpc } from '~/libs/rpc.ts';

export const Route = createFileRoute('/mcp-servers/$serverId')({
  component: RouteComponent,
  validateSearch: z.object({
    serverTab: z.enum(['tools']).optional(),
  }),
  params: {
    parse: params => {
      return {
        serverId: McpServerId.validator.parse(params.serverId),
      };
    },
  },
  beforeLoad: ({ context: { queryClient }, params: { serverId } }) => {
    void queryClient.prefetchQuery(rpc.mcpServers.get.queryOptions({ input: { serverId } }));
    void queryClient.prefetchQuery(rpc.mcpTools.list.queryOptions({ input: { serverId } }));
  },
});

function RouteComponent() {
  const { serverId } = Route.useParams();
  const { serverTab } = Route.useSearch();

  return (
    <CanvasLayout className="overflow-y-auto">
      <ServerHeadingCard serverId={serverId} />
      <ServerTabs serverId={serverId} activeTab={serverTab} />
    </CanvasLayout>
  );
}

function ServerHeadingCard({ serverId }: { serverId: TMcpServerId }) {
  const { data: server } = useSuspenseQuery(rpc.mcpServers.get.queryOptions({ input: { serverId } }));

  if (!server) {
    return <div>Server not found</div>;
  }

  return <div className="flex h-20 shrink-0 items-center px-6">{server.name}</div>;
}

function ServerTabs({ serverId, activeTab = 'root' }: { serverId: TMcpServerId; activeTab?: string }) {
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
          <ServerToolsList serverId={serverId} />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}

function ServerToolsList({ serverId }: { serverId: TMcpServerId }) {
  const { data: tools } = useSuspenseQuery(rpc.mcpTools.list.queryOptions({ input: { serverId } }));

  return (
    <>
      <div className="flex h-16 items-center border-b-[0.5px] px-4">
        <div>TODO filters etc...</div>
      </div>
      <div className="divide-y-[0.5px] pb-32">{tools?.map(tool => <ServerToolRow key={tool.id} tool={tool} />)}</div>
    </>
  );
}

function ServerToolRow({ tool }: { tool: McpToolSummarySelect }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <div className="flex flex-1 items-center gap-2 self-stretch rounded-xs text-sm">
        <div className="shrink-0">{tool.displayName || tool.name}</div>
        {/* <div className="ak-text/50 truncate">{tool.summary}</div> */}
      </div>

      <Button variant="ghost" size="sm" intent="primary" icon={faPlus}>
        Add
      </Button>
    </div>
  );
}
