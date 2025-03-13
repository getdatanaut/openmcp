import type { Meta } from '@storybook/react';

import { Button } from '../Button/button.tsx';
import { ButtonGroup } from '../Button/button-group.tsx';
import { Tab, type TabProps } from './tab.tsx';
import { TabList } from './tab-list.tsx';
import { TabPanel } from './tab-panel.tsx';
import { TabPanels } from './tab-panels.tsx';
import { Tabs, type TabsProps } from './tabs.tsx';

const meta = {
  title: 'Components / Tabs',
  component: Tabs,
} satisfies Meta<typeof Tabs>;

export default meta;

export const LineVariant = (props: TabsProps) => (
  <div className="flex w-80 flex-col rounded border">
    <Tabs defaultSelectedId="documents" {...props}>
      <TabList className="ak-layer">
        <Tab id="account">Account</Tab>
        <Tab id="documents">Documents</Tab>
        <Tab id="settings">Settings</Tab>
      </TabList>

      <TabPanels className="h-60">
        <TabPanel tabId="account">
          <div>Make changes to your account.</div>
        </TabPanel>

        <TabPanel tabId="documents">
          <div>Access and update your documents.</div>
        </TabPanel>

        <TabPanel tabId="settings">
          <div>Edit your profile or update contact information.</div>
        </TabPanel>
      </TabPanels>
    </Tabs>
  </div>
);

export const PlainVariant = (props: TabsProps) => <LineVariant variant="unstyled" {...props} />;

export const ButtonsAsTabs = (props: TabsProps) => {
  const TabButton = (props: TabProps) => (
    <Button variant={props['aria-selected'] ? 'solid' : 'ghost'} isInteractive={!props['aria-selected']} {...props} />
  );

  return (
    <div className="flex w-80 flex-col rounded border">
      <Tabs defaultSelectedId="documents" variant="unstyled" {...props}>
        <TabList className="border-b px-3 py-2" render={<ButtonGroup size="xs" className="gap-2" />}>
          <Tab id="account" render={TabButton}>
            Account
          </Tab>
          <Tab id="documents" render={TabButton}>
            Documents
          </Tab>
          <Tab id="settings" render={TabButton}>
            Settings
          </Tab>
        </TabList>

        <TabPanels className="h-60 px-4.5 py-4">
          <TabPanel tabId="account">
            <div>Make changes to your account.</div>
          </TabPanel>

          <TabPanel tabId="documents">
            <div>Access and update your documents.</div>
          </TabPanel>

          <TabPanel tabId="settings">
            <div>Edit your profile or update contact information.</div>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  );
};
