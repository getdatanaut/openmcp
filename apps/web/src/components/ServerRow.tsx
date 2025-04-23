import { faWrench } from '@fortawesome/free-solid-svg-icons';
import { Avatar, Icon, tn } from '@libs/ui-primitives';
import { Link } from '@tanstack/react-router';

import type { McpServer } from '~shared/zero-schema.ts';

export interface ServerRowProps {
  server: Pick<McpServer, 'id' | 'name' | 'summary' | 'iconUrl' | 'toolCount'>;
  isActive: boolean;
  children?: React.ReactNode;
}

export function ServerRow({ server, isActive, children }: ServerRowProps) {
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

  return (
    <div className={tn(!isActive && 'hover:ak-layer-hover-0.2', isActive && 'ak-layer-hover-0.3')}>
      {serverElem}
      {children}
    </div>
  );
}
