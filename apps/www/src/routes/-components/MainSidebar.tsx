import { createElement } from '@ariakit/react-core/utils/system';
import type { Options } from '@ariakit/react-core/utils/types';
import {
  faBars,
  faCaretDown,
  faCaretLeft,
  faCaretRight,
  faComments,
  faPlus,
  faServer,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';
import {
  Avatar,
  Button,
  ButtonGroup,
  type ButtonProps,
  Icon,
  type IconProps,
  Menu,
  MenuOptionGroup,
  MenuOptionItem,
  tn,
  twMerge,
} from '@libs/ui-primitives';
import type { Server, ThreadStorageData } from '@openmcp/manager';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams, useSearch } from '@tanstack/react-router';
import { formatDate, isThisWeek, isToday, isYesterday } from 'date-fns';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';

import { useCurrentManager } from '~/hooks/use-current-manager.tsx';
import { useElementSize } from '~/hooks/use-element-size.tsx';
import { useRootStore } from '~/hooks/use-root-store.tsx';
import { type TMcpServerId, type TThreadId } from '~/utils/ids.ts';

export const MainSidebar = observer(({ className }: { className?: string }) => {
  const { sidebar } = useSearch({ strict: false });

  const { app } = useRootStore();

  const [ref, { width }] = useElementSize();

  useEffect(() => {
    app.setSidebarWidth(width);
  }, [width, app]);

  let content = <ThreadHistory />;
  if (sidebar === 'servers') {
    content = <ServersSidebar />;
  }

  return (
    <div
      ref={ref}
      className={twMerge('ease-spring flex h-screen flex-col transition-[width] duration-150 ease-in-out', className)}
    >
      {/* This header section stays visible even when collapsed */}
      <div className="ak-layer-0 sticky top-0 z-10">
        <div className="h-10" />
        <div
          className={twMerge(
            'absolute top-0 left-3 flex h-10 items-center transition-[left,top] duration-200 ease-in-out',
            app.sidebarCollapsed && 'left-2',
            app.sidebarCollapsed && !app.canvasHasHeader && 'top-2 left-5',
          )}
        >
          <ButtonGroup size="sm" variant="outline">
            <Button
              icon={app.sidebarCollapsed ? faCaretRight : faCaretLeft}
              onClick={() => app.setSidebarCollapsed(!app.sidebarCollapsed)}
            />
            <SettingsMenu />
            <Button icon={faPlus} intent="primary" render={<Link to="/threads" activeOptions={{ exact: true }} />} />
          </ButtonGroup>
        </div>
      </div>

      {/* Everything below the header fades in/out */}
      <div
        className={twMerge(
          'flex flex-1 flex-col transition-opacity duration-100',
          app.sidebarCollapsed ? 'opacity-0' : 'opacity-100',
        )}
      >
        <div className="flex flex-col items-start gap-1 pt-5 pl-3">
          <SidebarListItem
            name="History"
            isActive={sidebar === 'history'}
            icon={faComments}
            render={<Link to="." search={{ sidebar: 'history' }} />}
          />
          <SidebarListItem
            name="Servers"
            isActive={sidebar === 'servers'}
            icon={faServer}
            render={<Link to="." search={{ sidebar: 'servers' }} />}
          />
        </div>

        <div className="flex-1 overflow-y-auto pt-5 pb-12">{content}</div>
      </div>
    </div>
  );
});

const SidebarSection = ({
  name,
  children,
  collapsible = false,
}: {
  name: string;
  children: React.ReactNode;
  collapsible?: boolean;
}) => {
  return (
    <div>
      <div className="flex cursor-default items-center gap-2.5 border-y-[0.5px] px-5 py-2 text-sm">
        {collapsible ? <Icon icon={faCaretDown} className="pl-0.5 text-[0.8em]" /> : null}
        <div>{name}</div>
      </div>

      <div className="flex flex-col gap-1 px-3 py-5">{children}</div>
    </div>
  );
};

const SidebarListItem = ({
  name,
  icon,
  action,
  isActive,
  ...rest
}: {
  name: string;
  icon?: IconProps['icon'];
  action?: ButtonProps;
  isActive?: boolean;
  ref?: React.Ref<HTMLElement>;
} & Options) => {
  const className = tn(
    'ak-frame-sm group hover:ak-layer-pop active:ak-layer-pop-[1.5] flex cursor-pointer items-center gap-2 py-1.5 pr-2 pl-2.5 active:cursor-default',
  );

  const children = (
    <>
      {icon ? <Icon icon={icon} className="text-xs" fw /> : null}

      <div className="truncate text-sm">{name}</div>

      {action ? (
        <Button
          variant="ghost"
          size="xs"
          {...action}
          className={tn('invisible ml-auto group-hover:visible', action.className)}
        />
      ) : null}
    </>
  );

  return createElement('div', { ...rest, className, children, 'data-active': isActive || undefined });
};

/**
 * History
 */

const ThreadHistory = () => {
  const { manager } = useCurrentManager();
  const queryClient = useQueryClient();

  const { threadId: activeThreadId } = useParams({ strict: false });
  const navigate = useNavigate();

  const { data: threads } = useQuery({
    queryKey: ['threads'],
    queryFn: () => manager.threads.findMany(),
  });

  const { mutate: deleteThread } = useMutation({
    mutationFn: manager.threads.delete,
    onSuccess: (_, { id }) => {
      if (id === activeThreadId) {
        void navigate({ to: '/threads' });
      }

      // @TODO rework react query usage to consolidate query options into one spot, best practices
      void queryClient.invalidateQueries({ queryKey: ['threads'] });
    },
  });

  const sortedThreads = threads?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const groupedThreads =
    sortedThreads?.reduce(
      (acc, thread) => {
        const date = thread.createdAt ? new Date(thread.createdAt) : new Date();

        let name = '';
        if (isToday(date)) {
          name = 'Today';
        } else if (isYesterday(date)) {
          name = 'Yesterday';
        } else if (isThisWeek(date)) {
          name = 'This Week';
        } else {
          name = formatDate(date, 'PP');
        }

        acc[name] = {
          date,
          name,
          threads: [...(acc[name]?.threads || []), thread],
        };
        return acc;
      },
      {} as Record<string, { name: string; date: Date; threads: ThreadStorageData[] }>,
    ) || {};

  return (
    <div className="flex flex-col gap-8">
      {Object.values(groupedThreads).map(groupedThread => (
        <SidebarSection key={groupedThread.name} name={groupedThread.name}>
          {groupedThread.threads?.map(thread => (
            <ThreadListItem
              key={thread.id}
              {...thread}
              id={thread.id as TThreadId}
              handleDelete={e => {
                e.preventDefault();
                deleteThread({ id: thread.id });
              }}
            />
          ))}
        </SidebarSection>
      ))}
    </div>
  );
};

const ThreadListItem = ({
  id,
  name,
  handleDelete,
}: {
  id: TThreadId;
  name: string;
  handleDelete?: React.MouseEventHandler<HTMLElement>;
}) => {
  return (
    <SidebarListItem
      name={name}
      render={<Link to="/threads/$threadId" params={{ threadId: id }} />}
      action={{
        icon: faTimes,
        onClick: handleDelete,
        title: 'Delete thread',
      }}
    />
  );
};

/**
 * Servers
 */

const ServersSidebar = () => {
  return (
    <>
      <InstalledServers />
      <AvailableServers />
    </>
  );
};

const InstalledServers = () => {
  const { manager } = useCurrentManager();
  const queryClient = useQueryClient();

  const { data: clientServers } = useQuery({
    queryKey: ['clientServers'],
    queryFn: () => manager.clientServers.findMany(),
  });

  const { data: servers } = useQuery({
    queryKey: ['servers'],
    queryFn: () => manager.servers.findMany(),
    staleTime: 1000 * 60 * 60 * 24,
  });

  const { mutate: deleteClientServer } = useMutation({
    mutationFn: manager.clientServers.delete,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['clientServers'] });
    },
  });

  let content;
  if (!servers || !clientServers) {
    content = <div className="invisible text-sm">prevents layout shift</div>;
  } else {
    const combined = clientServers.map(cs => {
      const server = servers.find(s => s.id === cs.serverId);

      return {
        clientServer: cs,
        server,
      };
    });

    const sorted = combined.sort((a, b) => (a.server?.name || '').localeCompare(b.server?.name || ''));

    if (sorted.length === 0) {
      content = <div className="pl-2 text-sm opacity-50">Add some below...</div>;
    } else {
      content = (
        <>
          {sorted.map(({ clientServer, server }) => {
            if (!server) {
              // @TODO: show item w button to cleanup client that is missing server config?
              console.warn(`Server ${clientServer.serverId} not found for client server ${clientServer.id}`);
              return null;
            }

            return (
              <ServerListItem
                key={clientServer.id}
                server={server}
                handleDelete={() => deleteClientServer({ id: clientServer.id })}
              />
            );
          })}
        </>
      );
    }
  }

  return (
    <SidebarSection name="Installed" collapsible>
      {content}
    </SidebarSection>
  );
};

const AvailableServers = observer(() => {
  const { manager } = useCurrentManager();

  const { data: servers } = useQuery({
    queryKey: ['servers'],
    queryFn: () => manager.servers.findMany(),
  });

  const sorted = (servers || []).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <SidebarSection name="Available" collapsible>
      {sorted.map(server => (
        <ServerListItem
          key={server.id}
          server={server}
          handleAdd={() => {}}
          render={<Link to="." search={prev => ({ ...prev, server: server.id as TMcpServerId })} />}
        />
      ))}
    </SidebarSection>
  );
});

const ServerListItem = observer(
  ({
    server,
    handleAdd,
    handleDelete,
    ref,
    ...otherProps
  }: {
    server: Server;
    handleAdd?: React.MouseEventHandler<HTMLElement>;
    handleDelete?: React.MouseEventHandler<HTMLElement>;
    ref?: React.Ref<HTMLElement>;
  } & Options) => {
    const { app } = useRootStore();

    const icon = app.currentThemeId === 'light' ? server.presentation?.icon?.light : server.presentation?.icon?.dark;
    const iconElem = icon ? (
      <img src={icon} alt={server.name} className="ak-frame-xs h-10 w-10" />
    ) : (
      <Avatar name={server.name} size="lg" />
    );

    const className = tn('ak-frame-sm hover:ak-layer-pop group flex cursor-pointer items-center gap-4 p-2');
    const children = (
      <>
        <div className="pt-px">{iconElem}</div>

        <div className="flex flex-1 flex-col">
          <div>{server.name}</div>
          {server.presentation?.category ? (
            <div className="text-xs capitalize opacity-50">{server.presentation.category}</div>
          ) : null}
        </div>

        <div>
          {handleAdd ? (
            <Button
              variant="outline"
              size="xs"
              onClick={handleAdd}
              // Right now clicking on server list item is the same thing as clicking add, so no point in tabbing to it
              tabIndex={-1}
            >
              Add
            </Button>
          ) : null}

          {handleDelete ? (
            <Button
              className="invisible group-hover:visible"
              variant="ghost"
              size="xs"
              icon={faTimes}
              title="Delete server"
              onClick={handleDelete}
            />
          ) : null}
        </div>
      </>
    );

    return createElement('div', { ...otherProps, ref, className, children });
  },
);

/**
 * Settings
 */

const SettingsMenu = observer(() => {
  const { app } = useRootStore();

  return (
    <Menu trigger={<Button icon={faBars} />}>
      <Menu label="Theme">
        <MenuOptionGroup label="Colors" value={app.currentThemeId} onChange={app.setThemeId}>
          {app.prebuiltThemes.map(theme => (
            <MenuOptionItem key={theme.id} value={theme.id}>
              {theme.name}
            </MenuOptionItem>
          ))}
        </MenuOptionGroup>
        <MenuOptionGroup label="Font" value={app.fontId} onChange={app.setFontId}>
          <MenuOptionItem value="mono">Mono</MenuOptionItem>
          <MenuOptionItem value="sans">Sans</MenuOptionItem>
        </MenuOptionGroup>
      </Menu>
    </Menu>
  );
});
