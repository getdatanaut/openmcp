import { faPlus } from '@fortawesome/free-solid-svg-icons';
import type { RouterOutputs } from '@libs/api-contract';
import { Avatar, Button } from '@libs/ui-primitives';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';

import { CanvasLayout } from '~/components/CanvasLayout.tsx';
import { rpc } from '~/libs/rpc.ts';

export const Route = createFileRoute('/mcp-servers')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <CanvasLayout>
      <div className="h-full overflow-y-auto">
        <HeadingCard />
        <ServersList />
      </div>
    </CanvasLayout>
  );
}

function HeadingCard() {
  return <div className="flex h-48 items-center justify-center">MCP Servers</div>;
}

function ServersList() {
  const { data: servers, isLoading } = useQuery(rpc.mcpServers.list.queryOptions());

  let content;
  if (isLoading) {
    content = <div>Loading...</div>;
  } else if (servers) {
    content = servers.map(server => <ServerRow key={server.id} server={server} />);
  } else {
    content = <div>No servers found</div>;
  }

  return <div className="border-t-[0.5px] py-10">{content}</div>;
}

function ServerRow({ server }: { server: RouterOutputs['mcpServers']['list'][number] }) {
  const iconElem = server.iconUrl ? (
    <img src={server.iconUrl} alt={server.name} className="ak-frame-xs h-full w-full" />
  ) : (
    <Avatar name={server.name} size="lg" />
  );

  return (
    <>
      <div className="flex items-center gap-5 px-8">
        <div className="ak-layer flex h-14 w-14 shrink-0 items-center justify-center rounded border-[0.5px] p-1">
          {iconElem}
        </div>

        <div className="flex flex-col gap-1">
          <div>{server.name}</div>
          <div className="ak-text/50 truncate text-sm">{server.summary}</div>
        </div>
      </div>

      <div className="ml-15 flex flex-col gap-1 border-l-[0.5px] py-8 pl-12">
        {server.tools.slice(0, 3).map(tool => (
          <ServerToolRow key={tool.id} tool={tool} />
        ))}
      </div>
    </>
  );
}

function ServerToolRow({ tool }: { tool: RouterOutputs['mcpServers']['list'][number]['tools'][number] }) {
  return (
    <div className="flex items-center gap-1">
      <Button variant="soft" size="sm" icon={faPlus} title="Add tool to agent" />

      <div className="ak-layer-[0.7] flex flex-1 items-center gap-2 self-stretch rounded-xs px-2 py-1.5 text-sm">
        <div className="shrink-0">{tool.displayName || tool.name}</div>
        <div className="ak-text/50 truncate">{tool.summary}</div>
      </div>
    </div>
  );
}
