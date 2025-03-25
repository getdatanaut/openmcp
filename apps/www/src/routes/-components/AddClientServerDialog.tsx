import {
  Dialog,
  DialogBody,
  DialogDismiss,
  DialogFooter,
  DialogHeader,
  DialogSlot,
  FormButton,
  Heading,
} from '@libs/ui-primitives';
import type { Server } from '@openmcp/manager';
import { useMutation, useQuery } from '@tanstack/react-query';

import { JsonSchemaForm, JsonSchemaFormFields, useJsonSchemaForm } from '~/components/JsonSchemaForm.tsx';
import { Markdown } from '~/components/Markdown.tsx';
import { useCurrentManager } from '~/hooks/use-current-manager.tsx';
import { useRootStore } from '~/hooks/use-root-store.tsx';
import { ClientServerId, type TMcpServerId } from '~/utils/ids.ts';

export const AddClientServerDialog = ({
  isOpen,
  onClose,
  serverId,
}: {
  isOpen: boolean;
  onClose: () => void;
  serverId?: TMcpServerId;
}) => {
  return (
    <Dialog isOpen={isOpen} onClose={onClose} unmountOnHide size="xl">
      {({ close }) => (serverId ? <AddClientServerDialogContent serverId={serverId} close={close} /> : null)}
    </Dialog>
  );
};

const AddClientServerDialogContent = ({ serverId, close }: { serverId: TMcpServerId; close: () => void }) => {
  const { app, queryClient } = useRootStore();
  const { manager } = useCurrentManager();

  const { data: servers } = useQuery({
    queryKey: ['servers'],
    queryFn: () => manager.servers.findMany({}),
    staleTime: 1000 * 60 * 60 * 24,
  });

  const server = servers?.find(server => server.id === serverId);

  const { mutateAsync: createClientServer } = useMutation({
    mutationFn: (values: Record<string, string | number | boolean>) => {
      return manager.clientServers.create({
        id: ClientServerId.generate(),
        clientId: app.currentUserId,
        serverId: serverId,
        serverConfig: values,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['clientServers'] });
      close();
    },
  });

  return (
    <>
      <DialogHeader>
        <Heading slot={DialogSlot.title} size={3}>
          Add {server?.name}
        </Heading>
      </DialogHeader>

      {server && <AddClientServerDialogForm server={server} handleSubmit={createClientServer} />}
    </>
  );
};
const AddClientServerDialogForm = ({
  server,
  handleSubmit,
}: {
  server: Server;
  handleSubmit: (values: Record<string, string | number | boolean>) => Promise<unknown>;
}) => {
  const { form } = useJsonSchemaForm({ schema: server.configSchema });
  form.useSubmit(async ({ values }) => {
    await handleSubmit(values);
  });

  return (
    <JsonSchemaForm schema={server.configSchema} form={form}>
      <DialogBody className="flex flex-col gap-8">
        {server.presentation?.description ? (
          <Markdown content={server.presentation.description} className="text-sm font-light" />
        ) : null}

        <JsonSchemaFormFields />
      </DialogBody>

      <DialogFooter>
        <DialogDismiss variant="ghost">Cancel</DialogDismiss>
        <FormButton type="submit" validProps={{ intent: 'primary' }}>
          Add
        </FormButton>
      </DialogFooter>
    </JsonSchemaForm>
  );
};
