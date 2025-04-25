import type { McpTool } from '@libs/db-pg';

export interface ServerToolRowProps {
  tool: Pick<McpTool, 'id' | 'name' | 'displayName' | 'summary'>;
  actionElem: React.ReactNode;
}

export function ServerToolRow({ tool, actionElem }: ServerToolRowProps) {
  return (
    <div className="flex items-center gap-1">
      {actionElem}

      <div className="ak-layer-pop-0.7 flex flex-1 items-center gap-2 self-stretch rounded-xs px-2 text-sm">
        <div className="shrink-0">{tool.displayName || tool.name}</div>
        <div className="ak-text/50 truncate">{tool.summary}</div>
      </div>
    </div>
  );
}
