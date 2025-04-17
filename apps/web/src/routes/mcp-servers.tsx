import { faWrench } from '@fortawesome/free-solid-svg-icons';
import type { RouterOutputs } from '@libs/api-contract';
import { McpServerId, type TMcpServerId } from '@libs/db-ids';
import { Avatar, Icon } from '@libs/ui-primitives';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, Link, linkOptions, Outlet, useParams, useSearch } from '@tanstack/react-router';
import { Suspense } from 'react';
import { z } from 'zod';

import { CanvasLayout } from '~/components/CanvasLayout.tsx';
import { rpc } from '~/libs/rpc.ts';

export const Route = createFileRoute('/mcp-servers')({
  component: RouteComponent,
  beforeLoad: ({ context: { queryClient } }) => {
    void queryClient.prefetchQuery(rpc.mcpServers.list.queryOptions());
  },
});

function RouteComponent() {
  const { serverId } = useParams({ strict: false });

  return (
    <>
      <CanvasLayout className="overflow-y-auto">
        <ServersHeadingCard />
        <Suspense fallback={<div>Loading...</div>}>
          <ServersList activeServerId={serverId} />
        </Suspense>
      </CanvasLayout>

      <Outlet />
    </>
  );
}

function ServersHeadingCard() {
  return <div className="flex h-48 items-center justify-center">MCP Servers</div>;
}

function ServersList({ activeServerId }: { activeServerId?: TMcpServerId }) {
  const { data: servers } = useSuspenseQuery(rpc.mcpServers.list.queryOptions());

  let content;
  if (servers) {
    content = servers.map(server => (
      <ServerRow key={server.id} server={server} isActive={activeServerId === server.id} />
    ));
  } else {
    content = <div>No servers found</div>;
  }

  return <div className="divide-y-[0.5px] border-t-[0.5px] pb-32">{content}</div>;
}

function ServerRow({ server, isActive }: { server: RouterOutputs['mcpServers']['list'][number]; isActive: boolean }) {
  const iconElem = server.iconUrl ? (
    <img src={server.iconUrl} alt={server.name} className="ak-frame-xs h-full w-full" />
  ) : (
    <Avatar name={server.name} size="lg" />
  );

  const linkProps = isActive
    ? linkOptions({ to: '/mcp-servers' })
    : linkOptions({ to: '/mcp-servers/$serverId', params: { serverId: server.id } });

  return (
    <Link
      {...linkProps}
      className="hover:ak-layer-hover-[0.3] active:ak-layer-hover-[0.4] flex items-center gap-5 px-4 py-4"
    >
      <div className="flex h-14 w-14 shrink-0 items-center justify-center">{iconElem}</div>

      <div className="flex flex-1 flex-col gap-1">
        <div>{server.name}</div>
        <div className="ak-text/50 truncate text-sm">{server.summary}</div>
      </div>

      <div className="flex shrink-0 gap-3 text-sm">
        <div className="ak-text/60 flex items-center gap-1.5" title={`${server.toolCount} tools`}>
          <Icon icon={faWrench} />
          <div>{server.toolCount}</div>
        </div>
      </div>
    </Link>
  );
}
