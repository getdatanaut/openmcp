import { faArrowUp, faBars, faCaretDown, faCog, faPlus } from '@fortawesome/free-solid-svg-icons';
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
import { Markdown } from '@libs/ui-primitives/markdown';
import { createFileRoute, Link } from '@tanstack/react-router';
import { observer } from 'mobx-react-lite';
import React, { type ReactNode, useState } from 'react';

import { useRootStore } from '~/stores/root.ts';
import { generateMockConversation, generateMockServers, type MCPServerConfig } from '~/utils/mocks.ts';

export const Route = createFileRoute('/')({
  component: HomeRoute,
});

const mockConversation = generateMockConversation();
const mockServers = generateMockServers();

function HomeRoute() {
  return (
    <div className="ak-edge flex min-h-screen divide-x-[0.5px]">
      <div className="h-screen flex-1 overflow-y-auto">
        <div className="ak-layer-0 sticky top-0 z-10 flex h-12 items-center border-b-[0.5px]">
          <div className="flex h-full w-14 items-center justify-center">
            <Button icon={faPlus} size="xs" variant="solid" intent="primary" />
          </div>

          <div className="flex h-full flex-1 items-center gap-4 border-l-[0.5px] px-4">
            <div className="mx-auto text-sm">{mockConversation.name}</div>
          </div>
        </div>

        <div className="flex-1 pr-px">
          <ChatList>
            {mockConversation.messages.map((message, index) => (
              <ChatListItem key={index} role={message.role} content={message.content} lineNumber={index + 1} />
            ))}
          </ChatList>

          <div className="ak-layer-0 sticky bottom-0 border-t-[0.5px]">
            <div className="mx-auto max-w-[50rem]">
              <ChatInput
                onSubmit={() => {
                  alert('enter pressed');
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <Sidebar />
    </div>
  );
}

const Sidebar = () => {
  const { sidebar } = Route.useSearch();

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
  return (
    <div className="flex flex-col gap-8 px-3.5 py-8">
      <HistorySection name="Previous 30 Days">
        <HistoryItem name={mockConversation.name} isActive />
        <HistoryItem name="Server Sent Events SSE" />
        <HistoryItem name="Replace main with mobx" />
        <HistoryItem name="Local SSL Setup Guide" />
      </HistorySection>

      <HistorySection name="January">
        <HistoryItem name="List hidden folders OSX" />
        <HistoryItem name="Partitioning by Tenant_ID" />
        <HistoryItem name="Array Column vs Join Table" />
        <HistoryItem name="PostgreSQL Schema Limits" />
        <HistoryItem name="R1 DeepSeq Model Requirements" />
        <HistoryItem name="Wi-Fi Calling on AT&T" />
        <HistoryItem name="Orphan Containers in Docker" />
      </HistorySection>

      <HistorySection name="2024">
        <HistoryItem name="Top Beers for Pilsner Lovers" />
        <HistoryItem name="Capital Gains Tax Impact" />
        <HistoryItem name="Prioritizing custom props autocomplete" />
      </HistorySection>
    </div>
  );
};

const ChatList = ({ children }: { children: ReactNode }) => {
  return <div className="flex flex-col divide-y-[0.5px]">{children}</div>;
};

const ChatListItem = observer(
  ({
    content,
    role,
    isActive,
    lineNumber,
  }: {
    content: string;
    role: 'user' | 'assistant';
    isActive?: boolean;
    lineNumber: number;
  }) => {
    const { app } = useRootStore();
    const classes = tn('hover:ak-layer-[0.2] px-14');

    const containerClasses = tn(
      'relative flex border-l-[0.5px] py-14',
      role === 'user' && 'ak-text-secondary/70',
      role === 'assistant' && 'ak-text/80',
    );

    const contentClasses = tn('mx-auto w-full max-w-[50rem] leading-relaxed');

    return (
      <div className={classes}>
        <div className={containerClasses}>
          {lineNumber > 1 ? (
            <div className="ak-layer-0 absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 border-[0.5px] px-1 text-sm font-light">
              <div className="opacity-60">{lineNumber}</div>
            </div>
          ) : null}

          <div className={contentClasses}>
            <div className="dn-prose min-w-0 flex-1">
              <Markdown codeTheme={app.theme?.codeTheme ?? 'github-dark'} content={content} />
            </div>
          </div>
        </div>
      </div>
    );
  },
);

const ChatInput = ({
  onSubmit,
  isDisabled,
}: {
  isDisabled?: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) => {
  const [value, setValue] = useState('');

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isDisabled) return;

    if (e.key === 'Enter' && e.metaKey) {
      e.preventDefault();
      onSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
    }
  };

  return (
    <form className="flex items-center gap-3">
      <input
        id="message"
        name="message"
        type="text"
        placeholder="Whatchu want?"
        className="flex-1 py-6 caret-[var(--color-secondary)] focus:outline-none"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        autoComplete="off"
        autoFocus
      />

      <Button type="submit" icon={faArrowUp} variant="solid" intent={value ? 'primary' : 'neutral'} disabled={!value} />
    </form>
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

const HistoryItem = ({ name, isActive }: { name: string; isActive?: boolean }) => {
  const className = tn(
    'ak-frame-sm px-3 py-2',
    isActive && 'ak-layer cursor-default',
    !isActive && 'hover:ak-layer cursor-pointer',
  );

  return (
    <div className={className} title={name}>
      <div className="truncate text-sm">{name}</div>
    </div>
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
