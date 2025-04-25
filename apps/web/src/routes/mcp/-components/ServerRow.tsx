import { faWrench } from '@fortawesome/free-solid-svg-icons';
import { Avatar, Icon, tn } from '@libs/ui-primitives';
import { Link } from '@tanstack/react-router';

import type { McpServer } from '~shared/zero-schema.ts';

export interface ServerRowProps {
  server: Pick<McpServer, 'id' | 'name' | 'summary' | 'iconUrl' | 'toolCount'>;
  isActive: boolean;
}

export function ServerRow({ server, isActive }: ServerRowProps) {
  const iconElem = server.iconUrl ? (
    <img src={server.iconUrl} alt={server.name} className="ak-frame-xs h-full w-full" />
  ) : (
    <Avatar name={server.name} size="lg" />
  );

  return (
    <Link
      to="."
      search={prev => ({ ...prev, serverId: prev.serverId === server.id ? undefined : server.id })}
      className={tn(
        'relative flex items-center gap-5 border-b px-4 py-5 before:absolute before:inset-y-0 before:left-0 before:w-0.5',
        !isActive && 'hover:ak-layer-hover-0.2',
        isActive && 'before:bg-secondary',
      )}
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
