import { createElement } from '@ariakit/react-core/utils/system';
import type { Options } from '@ariakit/react-core/utils/types';
import { faCaretDown, faCog, faTimes } from '@fortawesome/free-solid-svg-icons';
import {
  Avatar,
  Button,
  ButtonGroup,
  type ButtonProps,
  Icon,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  type TabProps,
  Tabs,
  tn,
  twMerge,
} from '@libs/ui-primitives';
import type { Server, ThreadStorageData } from '@openmcp/manager';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams, useSearch } from '@tanstack/react-router';
import { formatDate, isThisWeek, isToday, isYesterday } from 'date-fns';
import { observer } from 'mobx-react-lite';
import React, { type MouseEventHandler, type ReactNode, type Ref, useEffect } from 'react';

import { useCurrentManager } from '~/hooks/use-current-manager.tsx';
import { useElementSize } from '~/hooks/use-element-size.tsx';
import { useRootStore } from '~/hooks/use-root-store.tsx';
import { type TMcpServerId, type TThreadId } from '~/utils/ids.ts';

export const MainSidebar = ({ className }: { className?: string }) => {
  const { sidebar } = useSearch({ strict: false });

  const { app } = useRootStore();

  const [ref, { width }] = useElementSize();

  useEffect(() => {
    app.setSidebarWidth(width);
  }, [width, app]);

  return (
    <div ref={ref} className={twMerge('ak-layer-[down-0.4] h-screen overflow-y-auto', className)}>
      <Tabs variant="unstyled" selectedId={sidebar} selectOnMove={false}>
        <div className="ak-layer-0 sticky top-0 flex h-12 items-center border-b-[0.5px] px-4">
          <TabList render={<ButtonGroup size="xs" className="flex-1 gap-2" />}>
            <Tab id="history" render={<TabButton render={<Link to="." search={{ sidebar: 'history' }} />} />}>
              History
            </Tab>
            <Tab id="servers" render={<TabButton render={<Link to="." search={{ sidebar: 'servers' }} />} />}>
              Agents
            </Tab>
            <Tab
              id="settings"
              className="ml-auto"
              render={<TabButton render={<Link to="." search={{ sidebar: 'settings' }} />} icon={faCog} />}
            />
          </TabList>
        </div>

        <TabPanels>
          <TabPanel tabId="history">
            <ThreadHistory />
          </TabPanel>

          <TabPanel tabId="servers">
            <ServersSidebar />
          </TabPanel>

          <TabPanel tabId="dev">
            <div>TODO</div>
          </TabPanel>

          <TabPanel tabId="settings">
            <SettingsSidebar />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  );
};

const SettingsSidebar = observer(() => {
  const { app } = useRootStore();

  return (
    <>
      <SidebarSection name="Theme">
        <div className="p-4">
          <ThemeList>
            {app.prebuiltThemes.map(theme => (
              <ThemeListItem key={theme.name} {...theme} />
            ))}
          </ThemeList>
        </div>
      </SidebarSection>
    </>
  );
});

const ThemeList = ({ children }: { children: ReactNode }) => {
  return <div className="flex flex-col gap-2.5">{children}</div>;
};

const ThemeListItem = observer(({ id, name, themeClass }: { id: string; name: string; themeClass: string }) => {
  const { app } = useRootStore();

  const isActive = app.theme?.themeClass === themeClass;
  const ribbonClasses = ['ak-layer-primary', 'ak-layer-secondary'];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      app.setThemeId(id);
    }
  };

  return (
    <div
      className={tn(
        `${themeClass} ak-edge-contrast-primary-1 ak-frame-xs focus:ring-2 focus:outline-none`,
        isActive && 'ring-2',
      )}
      onClick={() => app.setThemeId(id)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-pressed={isActive}
    >
      <div className="ak-layer-canvas ak-frame-xs hover:ak-layer-hover flex cursor-pointer items-center border-[0.5px] py-1 pr-3 pl-3">
        <div>{name}</div>
        <div className="ml-auto flex gap-1.5">
          {ribbonClasses.map((ribbonClass, index) => {
            const isLast = index === ribbonClasses.length - 1;

            return (
              <div key={index} className="relative">
                <div
                  className={tn(
                    `${ribbonClass} relative h-7 origin-right skew-x-[-20deg] transform-gpu rounded-xs`,
                    isLast ? 'w-7' : 'w-8',
                  )}
                />

                {isLast && (
                  <div
                    className={`${ribbonClass} absolute top-0 -right-1.5 h-7 w-4 rounded-r-xs`}
                    style={{ zIndex: 1 }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

const TabButton = (props: TabProps & ButtonProps) => (
  <Button variant={props['aria-selected'] ? 'solid' : 'ghost'} isInteractive={!props['aria-selected']} {...props} />
);

const ThreadHistory = () => {
  const manager = useCurrentManager();
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
    <div className="flex flex-col gap-8 px-3.5 py-8">
      {Object.values(groupedThreads).map(groupedThread => (
        <HistorySection key={groupedThread.name} name={groupedThread.name}>
          {groupedThread.threads?.map(thread => (
            <ThreadListItem
              key={thread.id}
              isActive={thread.id === activeThreadId}
              {...thread}
              id={thread.id as TThreadId}
              handleDelete={e => {
                e.preventDefault();
                deleteThread({ id: thread.id });
              }}
            />
          ))}
        </HistorySection>
      ))}
    </div>
  );
};

const SidebarSection = ({ name, children }: { name: string; children: ReactNode }) => {
  return (
    <div>
      <div className="ak-layer-pop flex items-center gap-2 px-4 py-1.5 text-sm">
        <Icon icon={faCaretDown} className="text-xs" />
        <div>{name}</div>
      </div>

      {children}
    </div>
  );
};

const HistorySection = ({ name, children }: { name: string; children: ReactNode }) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="px-1 text-sm font-bold">{name}</div>
      <div className="flex flex-col gap-px">{children}</div>
    </div>
  );
};

const ThreadListItem = ({
  id,
  name,
  handleDelete,
  isActive,
}: {
  id: TThreadId;
  name: string;
  handleDelete?: MouseEventHandler<HTMLElement>;
  isActive: boolean;
}) => {
  const className = tn(
    'ak-frame-sm group flex items-center px-3 py-2',
    isActive && 'ak-layer-pop cursor-default',
    !isActive && 'hover:ak-layer-pop cursor-pointer',
  );

  return (
    <Link className={className} title={name} to="/threads/$threadId" params={{ threadId: id }}>
      <div className="truncate text-sm">{name}</div>

      {handleDelete ? (
        <Button
          variant="ghost"
          size="xs"
          icon={faTimes}
          onClick={handleDelete}
          className="invisible ml-auto group-hover:visible"
          title="Delete thread"
        />
      ) : null}
    </Link>
  );
};

const ServersSidebar = () => {
  return (
    <>
      <InstalledServers />
      <AvailableServers />
    </>
  );
};

const InstalledServers = () => {
  const manager = useCurrentManager();
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
        <ServerList>
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
        </ServerList>
      );
    }
  }

  return (
    <SidebarSection name="Installed">
      <div className="px-3 py-4">{content}</div>
    </SidebarSection>
  );
};

const AvailableServers = observer(() => {
  const manager = useCurrentManager();

  const { data: servers } = useQuery({
    queryKey: ['servers'],
    queryFn: () => manager.servers.findMany(),
  });

  const sorted = (servers || []).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <SidebarSection name="Available">
      <div className="px-3 py-4">
        <ServerList>
          {sorted.map(server => (
            <ServerListItem
              key={server.id}
              server={server}
              handleAdd={() => {}}
              render={<Link to="." search={prev => ({ ...prev, server: server.id as TMcpServerId })} />}
            />
          ))}
        </ServerList>
      </div>
    </SidebarSection>
  );
});

const ServerList = ({ children }: { children: ReactNode }) => {
  return <div className="flex flex-col gap-px">{children}</div>;
};

const ServerListItem = observer(
  ({
    server,
    handleAdd,
    handleDelete,
    ref,
    ...otherProps
  }: {
    server: Server;
    handleAdd?: MouseEventHandler<HTMLElement>;
    handleDelete?: MouseEventHandler<HTMLElement>;
    ref?: Ref<HTMLElement>;
  } & Options) => {
    const { app } = useRootStore();

    const icon = app.currentThemeId === 'light' ? server.presentation?.icon?.light : server.presentation?.icon?.dark;
    const iconElem = icon ? (
      <img src={icon} alt={server.name} className="ak-frame-xs h-10 w-10" />
    ) : (
      <Avatar name={server.name} size="lg" />
    );

    const className = tn('ak-frame-xs hover:ak-layer-pop group flex cursor-pointer items-center gap-4 p-2');
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
