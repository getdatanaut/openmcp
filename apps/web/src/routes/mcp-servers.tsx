import { McpServerId, McpToolId } from '@libs/db-ids';
import { Input } from '@libs/ui-primitives';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Suspense, useCallback } from 'react';
import { z } from 'zod';

import { CanvasLayout } from '~/components/CanvasLayout.tsx';
import { ServerRow } from '~/components/ServerRow.tsx';
import { rpc } from '~/libs/rpc.ts';

export const Route = createFileRoute('/mcp-servers')({
  component: RouteComponent,
  validateSearch: z.object({
    serverId: McpServerId.validator.optional(),
    toolId: McpToolId.validator.optional(),
  }),
  beforeLoad: ({ context: { queryClient } }) => {
    void queryClient.prefetchQuery(rpc.mcpServers.listWithTools.queryOptions());
  },
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
  const { data: servers } = useSuspenseQuery(rpc.mcpServers.listWithTools.queryOptions());

  const handleToolToggle = useCallback(() => {
    alert('TODO.. for now create an agent via the sidebar and then add a tool to it');
  }, []);

  let content;
  if (servers.length) {
    content = servers.map(({ tools, ...server }) => (
      <ServerRow
        key={server.id}
        server={server}
        tools={tools}
        isActive={server.id === serverId}
        handleToolToggle={handleToolToggle}
      />
    ));
  } else {
    content = <div>No servers found</div>;
  }

  return <div className="flex-1 divide-y pb-32">{content}</div>;
}
