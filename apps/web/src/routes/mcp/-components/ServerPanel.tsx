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
import type { SetRequired } from '@libs/utils-types';
import { Link, useNavigate } from '@tanstack/react-router';
import { useCallback } from 'react';

import { useJsonSchemaForm } from '~/components/JsonSchemaForm/context.ts';
import { JsonSchemaForm } from '~/components/JsonSchemaForm/JsonSchemaForm.tsx';
import { JsonSchemaFormFields } from '~/components/JsonSchemaForm/JsonSchemaFormFields.tsx';
import { useZeroMutation } from '~/hooks/use-zero-mutation.ts';
import { useZeroQuery } from '~/hooks/use-zero-query.ts';
import type { AgentMcpServer, McpServer } from '~shared/zero-schema.ts';

export interface ServerPanelProps {
  serverId?: TMcpServerId;
  agentId?: TAgentId;
  agentServerId?: TAgentMcpServerId;
  activeTab?: string;
  renderToolsList: ({
    serverId,
    agentId,
    agentServerId,
  }: {
    serverId: TMcpServerId;
    agentId?: TAgentId;
    agentServerId?: TAgentMcpServerId;
  }) => React.ReactNode;
}

export function ServerPanel({ serverId, agentServerId, ...props }: ServerPanelProps) {
  if (agentServerId) {
    return <AgentMcpServerPanel agentServerId={agentServerId} {...props} />;
  }

  if (serverId) {
    return <McpServerPanel serverId={serverId} {...props} />;
  }

  return null;
}

type McpServerPanelProps = SetRequired<ServerPanelProps, 'serverId'>;

function McpServerPanel({ serverId, ...props }: McpServerPanelProps) {
  const [server] = useZeroQuery(z => z.query.mcpServers.where('id', serverId).one());

  return <ServerPanelContent server={server} {...props} />;
}

type AgentMcpServerPanelProps = SetRequired<ServerPanelProps, 'agentServerId'>;

function AgentMcpServerPanel({ agentServerId, ...props }: AgentMcpServerPanelProps) {
  const [server] = useZeroQuery(z => z.query.agentMcpServers.related('mcpServer').where('id', agentServerId).one());

  return <ServerPanelContent server={server?.mcpServer} agentMcpServer={server} {...props} />;
}

function ServerPanelContent({
  server,
  agentMcpServer,
  agentId,
  activeTab,
  renderToolsList,
}: {
  server?: McpServer;
  agentMcpServer?: AgentMcpServer;
  agentId?: TAgentId;
  activeTab?: string;
  renderToolsList: ServerPanelProps['renderToolsList'];
}) {
  if (!server) {
    return null;
  }

  const isInstalled = !!agentMcpServer;

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
        serverId={server.id}
        agentId={agentId}
        server={server}
        agentMcpServer={agentMcpServer}
        renderToolsList={renderToolsList}
      />
    </>
  );
}

function TabButton(props: TabProps) {
  return (
    <Button variant={props['aria-selected'] ? 'solid' : 'ghost'} isInteractive={!props['aria-selected']} {...props} />
  );
}

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
  renderToolsList: ServerPanelProps['renderToolsList'];
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

        {agentMcpServer ? <RemoveServerButton agentMcpServerId={agentMcpServer.id} /> : null}
      </TabList>

      <TabPanels className="px-6 pt-4 pb-6">
        <TabPanel tabId="root" unmountOnHide>
          {renderToolsList({ serverId, agentId, agentServerId: agentMcpServer?.id })}
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
  const navigate = useNavigate();

  const { form } = useJsonSchemaForm({
    schema: configSchema,
    defaultValues: config,
    values: config,
  });

  const { mutate: updateAgentMcpServer } = useZeroMutation(
    (z, { id, configJson }: { id: TAgentMcpServerId; configJson: Record<string, string | number | boolean> }) => ({
      op: z.mutate.agentMcpServers.update({ id, configJson }),
      onClientSuccess: () => {
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
    ) => {
      const id = AgentMcpServerId.generate();

      return {
        op: z.mutate.agentMcpServers.insert({ id, agentId, mcpServerId, configJson }),
        onClientSuccess: () => {
          alert('Server installed');
          void navigate({ to: '.', search: prev => ({ ...prev, serverId: mcpServerId, agentServerId: id }) });
        },
        onServerError(error) {
          alert(`Error installing server: ${error}`);
        },
      };
    },
    [navigate],
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

function RemoveServerButton({ agentMcpServerId }: { agentMcpServerId: TAgentMcpServerId }) {
  const navigate = useNavigate();

  const { mutate: deleteAgentMcpServer } = useZeroMutation(
    (z, { id }: { id: TAgentMcpServerId }) => ({
      op: z.mutate.agentMcpServers.delete({ id }),
      onClientSuccess() {
        void navigate({ to: '.', search: prev => ({ ...prev, agentServerId: undefined }), replace: true });
      },
      onServerError(error) {
        alert(`Error deleting server: ${error}`);
      },
    }),
    [navigate],
  );

  const handleClick = useCallback(async () => {
    if (agentMcpServerId) {
      await deleteAgentMcpServer({ id: agentMcpServerId });
    }
  }, [agentMcpServerId, deleteAgentMcpServer]);

  return (
    <Button variant="ghost" className="ml-auto" onClick={handleClick}>
      Uninstall
    </Button>
  );
}
