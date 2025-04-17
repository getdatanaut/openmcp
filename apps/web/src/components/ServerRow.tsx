import { faPlus, faTrash, faWrench } from '@fortawesome/free-solid-svg-icons';
import type {
  AgentMcpServerSummarySelect,
  AgentMcpToolSummarySelect,
  McpServerSummarySelect,
  McpToolSummarySelect,
} from '@libs/db-pg';
import { Avatar, Button, Icon, tn } from '@libs/ui-primitives';
import { Link } from '@tanstack/react-router';

export function ServerRow({
  server,
  tools,
  installedServer,
  installedTools,
  isActive,
  handleToolToggle,
}: {
  server: McpServerSummarySelect;
  tools: McpToolSummarySelect[];
  installedServer?: AgentMcpServerSummarySelect;
  installedTools?: AgentMcpToolSummarySelect[];
  isActive: boolean;
  handleToolToggle?: ({
    installedTool,
    tool,
  }: {
    installedTool?: AgentMcpToolSummarySelect;
    tool: McpToolSummarySelect;
  }) => void;
}) {
  const iconElem = server.iconUrl ? (
    <img src={server.iconUrl} alt={server.name} className="ak-frame-xs h-full w-full" />
  ) : (
    <Avatar name={server.name} size="lg" />
  );

  const serverElem = (
    <Link
      to="."
      search={prev => ({ ...prev, serverId: prev.serverId === server.id ? undefined : server.id })}
      className="flex items-center gap-5 px-4 py-5"
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

  let installedToolElems: React.ReactNode[] = [];
  let toolElems: React.ReactNode[] = [];
  if (isActive || installedServer) {
    for (const tool of tools) {
      const installedTool = installedTools?.find(t => t.mcpToolId === tool.id);
      if (installedTool) {
        installedToolElems.push(
          <ServerToolRow key={tool.id} tool={tool} installedTool={installedTool} handleToolToggle={handleToolToggle} />,
        );
      } else if (isActive) {
        toolElems.push(<ServerToolRow key={tool.id} tool={tool} handleToolToggle={handleToolToggle} />);
      }
    }
  }

  return (
    <div className={tn(!isActive && 'hover:ak-layer-hover-0.2', isActive && 'ak-layer-hover-0.3')}>
      {serverElem}

      {installedToolElems.length || toolElems.length ? (
        <div className="flex max-h-[30rem] flex-col gap-1 overflow-auto px-4 pt-2 pb-5">
          {installedToolElems}
          {toolElems}
        </div>
      ) : null}
    </div>
  );
}

function ServerToolRow({
  tool,
  installedTool,
  handleToolToggle,
}: {
  tool: McpToolSummarySelect;
  installedTool?: AgentMcpToolSummarySelect;
  handleToolToggle?: ({
    installedTool,
    tool,
  }: {
    installedTool?: AgentMcpToolSummarySelect;
    tool: McpToolSummarySelect;
  }) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="soft"
        size="sm"
        intent={installedTool ? 'danger' : 'primary'}
        icon={installedTool ? faTrash : faPlus}
        title={installedTool ? 'Remove tool from agent' : 'Add tool to agent'}
        onClick={() => handleToolToggle?.({ installedTool, tool })}
      />

      <div className="ak-layer-pop-0.7 flex flex-1 items-center gap-2 self-stretch rounded-xs px-2 text-sm">
        <div className="shrink-0">{tool.displayName || tool.name}</div>
        <div className="ak-text/50 truncate">{tool.summary}</div>
      </div>
    </div>
  );
}
