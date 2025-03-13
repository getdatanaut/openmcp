import { faCaretDown, faCog, faPlus } from '@fortawesome/free-solid-svg-icons';
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
import type { ReactNode } from 'react';

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
        <div className="ak-layer-0 sticky top-0 flex items-center gap-4 px-4 py-3">
          <Button endIcon={faCaretDown} size="xs" variant="outline">
            Main
          </Button>
          <div className="ak-text/50 text-xs">{mockConversation.name}</div>
          <Button icon={faPlus} size="xs" variant="outline" className="ml-auto">
            Thread
          </Button>
        </div>

        <div className="flex-1 py-8 pr-px">
          <ChatList>
            {mockConversation.messages.map((message, index) => (
              <ChatListItem key={index} role={message.role} content={message.content} lineNumber={index + 1} />
            ))}
          </ChatList>
        </div>
      </div>

      <Sidebar />
    </div>
  );
}

const Sidebar = () => {
  const { sidebar } = Route.useSearch();

  return (
    <div className="ak-layer-[down-0.5] h-screen w-96 overflow-y-auto">
      <Tabs variant="unstyled" selectedId={sidebar} selectOnMove={false}>
        <div className="ak-layer-0 sticky top-0 block px-4 py-3">
          <TabList render={<ButtonGroup size="xs" className="gap-2" />}>
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
            <div>TODO</div>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  );
};

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
  return <div className="flex flex-col gap-px divide-y-[0.5px]">{children}</div>;
};

const ChatListItem = ({
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
  const classes = tn('hover:ak-layer-[0.2] px-5 py-10');

  const contentClasses = tn(
    'mx-auto flex max-w-[50rem] leading-relaxed',
    role === 'user' && 'ak-text-secondary/70',
    role === 'assistant' && 'ak-text/80',
  );

  return (
    <div className={classes}>
      <div className={contentClasses}>
        <div className="w-10 flex-shrink-0 pr-5 text-right font-bold opacity-30">{lineNumber}</div>
        <div className="dn-prose w-full">
          <Markdown theme="dracula" content={content} />
        </div>
      </div>
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
      <div className="px-1 font-bold">{name}</div>
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
      <div className="truncate">{name}</div>
    </div>
  );
};

const ServerList = ({ children }: { children: ReactNode }) => {
  return <div className="flex flex-col gap-px">{children}</div>;
};

const ServerListItem = ({ server, isInstalled }: { server: MCPServerConfig; isInstalled?: boolean }) => {
  return (
    <div className="ak-frame-xs hover:ak-layer flex cursor-pointer items-center gap-4 px-3 py-3">
      <div className="pt-px">
        <img src={server.icon.dark} alt={server.name} className="ak-frame-xs h-10 w-10" />
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
};
