import { faCaretDown, faCog, faTimes } from '@fortawesome/free-solid-svg-icons';
import {
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
} from '@libs/ui-primitives';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate, useParams, useSearch } from '@tanstack/react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { observer } from 'mobx-react-lite';
import React, { type MouseEventHandler, type ReactNode } from 'react';

import { useCurrentManager } from '~/hooks/use-current-manager.ts';
import { useRootStore } from '~/hooks/use-root-store.ts';
import type { TThreadId } from '~/utils/ids.ts';
import { generateMockServers, type MCPServerConfig } from '~/utils/mocks.ts';

export const MainSidebar = () => {
  const { sidebar } = useSearch({ strict: false });

  return (
    <div className="ak-layer-[down-0.4] h-screen w-96 overflow-y-auto">
      <Tabs variant="unstyled" selectedId={sidebar} selectOnMove={false}>
        <div className="ak-layer-0 sticky top-0 flex h-12 items-center border-b-[0.5px] px-4">
          <TabList render={<ButtonGroup size="xs" className="flex-1 gap-2" />}>
            <Tab id="history" render={<TabButton render={<Link to="." search={{ sidebar: 'history' }} />} />}>
              History
            </Tab>
            <Tab id="servers" render={<TabButton render={<Link to="." search={{ sidebar: 'servers' }} />} />}>
              Servers
            </Tab>
            <Tab id="dev" render={<TabButton render={<Link to="." search={{ sidebar: 'dev' }} />} />}>
              Dev
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
            <ExampleHistorySidebar />
          </TabPanel>

          <TabPanel tabId="servers">
            <ExampleServerSidebar />
          </TabPanel>

          <TabPanel tabId="dev">
            <div>TODO</div>
          </TabPanel>

          <TabPanel tabId="settings">
            <ExampleSettingsSidebar />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  );
};

const ExampleSettingsSidebar = observer(() => {
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
      <div className="ak-layer-canvas ak-frame-xs hover:ak-layer flex cursor-pointer items-center border-[0.5px] py-1 pr-3 pl-3">
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

const mockServers = generateMockServers();

const ExampleServerSidebar = () => {
  const installed = [...mockServers.slice(0, 3)].sort((a, b) => a.name.localeCompare(b.name));
  const notInstalled = [...mockServers.slice(3)].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <SidebarSection name="Installed">
        <div className="px-2 py-3">
          <ServerList>
            {installed.map(server => (
              <ServerListItem key={server.name} server={server} isInstalled />
            ))}
          </ServerList>
        </div>
      </SidebarSection>

      <SidebarSection name="Not Installed">
        <div className="px-2 py-3">
          <ServerList>
            {notInstalled.map(server => (
              <ServerListItem key={server.name} server={server} />
            ))}
          </ServerList>
        </div>
      </SidebarSection>
    </>
  );
};

const ExampleHistorySidebar = () => {
  const { db } = useRootStore();
  const manager = useCurrentManager();

  const { threadId: activeThreadId } = useParams({ strict: false });
  const navigate = useNavigate();

  const threads = useLiveQuery(() => db.threads.toArray());

  const { mutate: deleteThread } = useMutation({
    mutationFn: manager.threads.delete,
    onSuccess: (_, { id }) => {
      if (id === activeThreadId) {
        void navigate({ to: '/threads' });
      }
    },
  });

  return (
    <div className="flex flex-col gap-8 px-3.5 py-8">
      <HistorySection name="Previous 30 Days">
        {threads?.map(thread => (
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
    </div>
  );
};

const SidebarSection = ({ name, children }: { name: string; children: ReactNode }) => {
  return (
    <div>
      <div className="ak-layer-down flex items-center gap-2 px-4 py-1.5 text-sm">
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
  handleDelete: MouseEventHandler<HTMLElement>;
  isActive: boolean;
}) => {
  const className = tn(
    'ak-frame-sm flex items-center px-3 py-2',
    isActive && 'ak-layer cursor-default',
    !isActive && 'hover:ak-layer cursor-pointer',
  );

  return (
    <Link className={className} title={name} to="/threads/$threadId" params={{ threadId: id }}>
      <div className="truncate text-sm">{name}</div>

      <Button
        variant="ghost"
        size="xs"
        icon={faTimes}
        onClick={handleDelete}
        className="ml-auto"
        title="Delete thread"
      />
    </Link>
  );
};

const ServerList = ({ children }: { children: ReactNode }) => {
  return <div className="flex flex-col gap-px">{children}</div>;
};

const ServerListItem = observer(({ server, isInstalled }: { server: MCPServerConfig; isInstalled?: boolean }) => {
  const { app } = useRootStore();

  return (
    <div className="ak-frame-xs hover:ak-layer flex cursor-pointer items-center gap-4 px-3 py-3">
      <div className="pt-px">
        <img
          src={app.currentThemeId === 'light' ? server.icon.light : server.icon.dark}
          alt={server.name}
          className="ak-frame-xs h-10 w-10"
        />
      </div>

      <div className="flex flex-1 flex-col">
        <div>{server.name}</div>
        <div className="text-xs capitalize opacity-50">{server.category}</div>
      </div>

      <div>
        {!isInstalled ? (
          <Button variant="outline" size="xs">
            Install
          </Button>
        ) : null}
      </div>
    </div>
  );
});
