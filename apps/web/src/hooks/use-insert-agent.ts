import { AgentId } from '@libs/db-ids';
import { toast } from '@libs/ui-primitives';
import { useNavigate, useRouter } from '@tanstack/react-router';

import { useZeroMutation } from './use-zero-mutation.ts';

export function useInsertAgent() {
  const navigate = useNavigate();
  const router = useRouter();

  return useZeroMutation(
    async z => {
      const id = AgentId.generate();

      return {
        op: z.mutate.agents.insert({ id }),
        onClientSuccess: () => navigate({ to: '/mcp/$agentId', params: { agentId: id } }),
        onServerError: () => {
          // @TODO: toast
          router.history.back();
        },
        onServerSuccess() {
          toast.success('Remix created successfully');
        },
      };
    },
    [navigate, router.history],
  );
}
