import { faCheck } from '@fortawesome/free-solid-svg-icons';
import {
  Button,
  Dialog,
  DialogBody,
  DialogDismiss,
  DialogFooter,
  DialogHeader,
  DialogSlot,
  FormButton,
  Heading,
} from '@libs/ui-primitives';
import type { ClientServer, Server } from '@openmcp/manager';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { JsonSchemaForm, JsonSchemaFormFields, useJsonSchemaForm } from '~/components/JsonSchemaForm.tsx';
import { Markdown } from '~/components/Markdown.tsx';
import { useCurrentManager } from '~/hooks/use-current-manager.tsx';
import { useRootStore } from '~/hooks/use-root-store.tsx';
import { ClientServerId, type TClientServerId, type TMcpServerId } from '~/utils/ids.ts';
import { queryOptions } from '~/utils/query-options.ts';

export const AddClientServerDialog = ({
  isOpen,
  onClose,
  serverId,
  clientServerId,
}: {
  isOpen: boolean;
  onClose: () => void;
  serverId?: TMcpServerId;
  clientServerId?: TClientServerId;
}) => {
  return (
    <Dialog isOpen={isOpen} onClose={onClose} unmountOnHide size="xl">
      {({ close }) =>
        serverId ? (
          <AddClientServerDialogContent serverId={serverId} clientServerId={clientServerId} close={close} />
        ) : null
      }
    </Dialog>
  );
};

const AddClientServerDialogContent = ({
  serverId: sId,
  clientServerId,
  close,
}: {
  serverId: TMcpServerId;
  clientServerId?: TClientServerId;
  close: () => void;
}) => {
  const { app, queryClient } = useRootStore();
  const { manager } = useCurrentManager();

  const { data: servers } = useQuery({
    ...queryOptions.servers(),
    queryFn: () => manager.servers.findMany(),
  });
  const { data: clientServers } = useQuery({
    ...queryOptions.clientServers(),
    enabled: !!clientServerId,
    queryFn: () => manager.clientServers.findMany(),
  });

  const clientServer = clientServerId ? clientServers?.find(cs => cs.id === clientServerId) : undefined;
  const serverId = clientServer?.serverId || sId;
  const server = servers?.find(server => server.id === serverId);

  const { mutateAsync: upsertClientServer } = useMutation({
    mutationFn: (values: Record<string, unknown>) => {
      if (clientServerId) {
        return manager.clientServers.update({ id: clientServerId }, { serverConfig: values });
      }

      return manager.clientServers.create({
        id: ClientServerId.generate(),
        clientId: app.currentUserId,
        serverId: serverId,
        serverConfig: values,
        enabled: true,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryOptions.clientServers().queryKey });
      close();
    },
  });

  const { mutateAsync: toggleClientServer } = useMutation({
    mutationFn: async () => {
      if (clientServer) {
        return manager.clientServers.update({ id: clientServer.id }, { enabled: !clientServer.enabled });
      }

      return;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryOptions.clientServers().queryKey });
    },
  });

  return (
    <>
      <DialogHeader>
        <Heading slot={DialogSlot.title} size={3}>
          {clientServerId ? '' : 'Add'} {server?.name}
        </Heading>
      </DialogHeader>

      {server && (
        <AddClientServerDialogForm server={server} clientServer={clientServer} handleSubmit={upsertClientServer}>
          <DialogBody className="flex flex-col gap-8">
            {server.presentation?.description ? (
              <Markdown content={server.presentation.description} className="text-sm font-light" />
            ) : null}

            <JsonSchemaFormFields />
          </DialogBody>

          <DialogFooter>
            {clientServer ? (
              <div className="flex-1">
                <Button
                  icon={clientServer.enabled ? faCheck : undefined}
                  variant={clientServer.enabled ? 'soft' : 'ghost'}
                  onClick={() => toggleClientServer()}
                >
                  {clientServer.enabled ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
            ) : null}

            <DialogDismiss variant="ghost">Cancel</DialogDismiss>
            <FormButton type="submit" validProps={{ intent: 'primary' }}>
              {clientServer ? 'Update' : 'Add'}
            </FormButton>
          </DialogFooter>
        </AddClientServerDialogForm>
      )}
    </>
  );
};

const AddClientServerDialogForm = ({
  server,
  clientServer,
  handleSubmit,
  children,
}: {
  server: Server;
  clientServer?: ClientServer;
  handleSubmit: (values: Record<string, string | number | boolean>) => Promise<unknown>;
  children: ReactNode;
}) => {
  const { form } = useJsonSchemaForm({
    schema: server.configSchema,
    defaultValues: clientServer?.serverConfig as Record<string, string | number | boolean>,
  });
  form.useSubmit(async ({ values }) => {
    await handleSubmit(values);
  });

  return (
    <JsonSchemaForm schema={server.configSchema} form={form}>
      {children}
    </JsonSchemaForm>
  );
};
