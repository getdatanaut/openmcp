import { faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import { AgentMcpServerId, type TAgentId, type TAgentMcpServerId, type TMcpServerId } from '@libs/db-ids';
import {
  Button,
  ButtonGroup,
  FormButton,
  Heading,
  Icon,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  type TabProps,
  Tabs,
  tn,
} from '@libs/ui-primitives';
import { Link } from '@tanstack/react-router';

import { useJsonSchemaForm } from '~/components/JsonSchemaForm/context.ts';
import { JsonSchemaForm } from '~/components/JsonSchemaForm/JsonSchemaForm.tsx';
import { JsonSchemaFormFields } from '~/components/JsonSchemaForm/JsonSchemaFormFields.tsx';
import { useZeroMutation } from '~/hooks/use-zero-mutation.ts';
import { useZeroQuery } from '~/hooks/use-zero-query.ts';
import type { AgentMcpServer, McpServer } from '~shared/zero-schema.ts';

export function ServerPanel({
  serverId,
  agentId,
  activeTab,
  renderToolsList,
}: {
  serverId: TMcpServerId;
  agentId?: TAgentId;
  activeTab?: string;
  renderToolsList: () => React.ReactNode;
}) {
  const [server] = useZeroQuery(z =>
    z.query.mcpServers
      .where('id', serverId)
      .related('agentMcpServers', q => q.where('agentId', agentId ?? 'ag_xxx').one())
      .one(),
  );

  if (!server) {
    return null;
  }

  const isInstalled = !!server.agentMcpServers;

  return (
    <>
      <div className="px-6 py-5">
        <Heading size={5}>{server.name}</Heading>

        <div className="flex items-center gap-3 pt-2 text-sm">
          <div className={tn('flex items-center gap-2', isInstalled ? 'ak-text-secondary' : 'ak-text/60')}>
            <Icon icon={isInstalled ? faCheck : faTimes} />
            <div>{isInstalled ? 'Installed' : 'Not installed'}</div>
          </div>
        </div>

        {server.description ? <div className="pt-8">{server.description}</div> : null}
      </div>

      <ServerTabs
        activeTab={activeTab}
        serverId={serverId}
        agentId={agentId}
        server={server}
        agentMcpServer={server?.agentMcpServers}
        renderToolsList={renderToolsList}
      />
    </>
  );
}

const TabButton = (props: TabProps) => (
  <Button variant={props['aria-selected'] ? 'solid' : 'ghost'} isInteractive={!props['aria-selected']} {...props} />
);

function ServerTabs({
  activeTab = 'root',
  serverId,
  agentId,
  server,
  agentMcpServer,
  renderToolsList,
}: {
  activeTab?: string;
  serverId: TMcpServerId;
  agentId?: TAgentId;
  server: McpServer;
  agentMcpServer?: AgentMcpServer;
  renderToolsList: () => React.ReactNode;
}) {
  return (
    <Tabs variant="unstyled" selectedId={activeTab} selectOnMove={false}>
      <TabList
        className="ak-layer-0 sticky inset-x-0 top-0 z-10 flex h-16 items-center px-6"
        render={<ButtonGroup size="sm" className="gap-2" />}
      >
        <Tab
          id="root"
          render={<TabButton render={<Link to="." search={prev => ({ ...prev, serverTab: undefined })} />} />}
        >
          Add Tools
        </Tab>

        <Tab
          id="config"
          render={<TabButton render={<Link to="." search={prev => ({ ...prev, serverTab: 'config' })} />} />}
        >
          Config
        </Tab>
      </TabList>

      <TabPanels className="px-6 pt-4 pb-6">
        <TabPanel tabId="root" unmountOnHide>
          {renderToolsList()}
        </TabPanel>

        <TabPanel tabId="config" unmountOnHide>
          <ServerConfigForm
            // This is important! Causes the form to re-mount on server change, which resets the form state
            key={`${agentId}-${serverId}-${agentMcpServer?.id}`}
            agentId={agentId}
            serverId={serverId}
            agentMcpServerId={agentMcpServer?.id}
            configSchema={server.configSchemaJson}
            config={agentMcpServer?.configJson || undefined}
          />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}

function ServerConfigForm({
  agentId,
  serverId,
  agentMcpServerId,
  configSchema,
  config,
}: {
  agentId?: TAgentId;
  serverId: TMcpServerId;
  agentMcpServerId?: TAgentMcpServerId;
  configSchema: McpServer['configSchemaJson'];
  config?: Record<string, string | number | boolean>;
}) {
  const { form } = useJsonSchemaForm({
    schema: configSchema,
    defaultValues: config,
    values: config,
  });

  const { mutate: updateAgentMcpServer } = useZeroMutation(
    (z, { id, configJson }: { id: TAgentMcpServerId; configJson: Record<string, string | number | boolean> }) => ({
      op: z.mutate.agentMcpServers.update({ id, configJson }),
      onSuccess: () => {
        alert('Server config updated');
      },
      onServerError(error) {
        alert(`Error updating server config: ${error}`);
      },
    }),
    [],
  );

  const { mutate: createAgentMcpServer } = useZeroMutation(
    (
      z,
      {
        agentId,
        mcpServerId,
        configJson,
      }: { agentId: TAgentId; mcpServerId: TMcpServerId; configJson: Record<string, string | number | boolean> },
    ) => ({
      op: z.mutate.agentMcpServers.insert({ id: AgentMcpServerId.generate(), agentId, mcpServerId, configJson }),
      onSuccess: () => {
        alert('Server installed');
      },
      onServerError(error) {
        alert(`Error installing server: ${error}`);
      },
    }),
    [],
  );

  form.useSubmit(async ({ values }) => {
    if (agentMcpServerId) {
      await updateAgentMcpServer({ id: agentMcpServerId, configJson: values });
    } else if (agentId) {
      await createAgentMcpServer({ agentId, mcpServerId: serverId, configJson: values });
    } else {
      alert('TODO');
    }
  });

  return (
    <JsonSchemaForm schema={configSchema} form={form}>
      <JsonSchemaFormFields />

      <FormButton type="submit" intent="primary">
        {agentMcpServerId ? 'Save' : 'Install'}
      </FormButton>
    </JsonSchemaForm>
  );
}
