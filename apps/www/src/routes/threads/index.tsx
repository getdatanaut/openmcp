import { tn } from '@libs/ui-primitives';
import { createFileRoute } from '@tanstack/react-router';
import { useCallback } from 'react';

import { useCurrentManager } from '~/hooks/use-current-manager.tsx';
import { type TThreadId } from '~/utils/ids.ts';

import { Thread, ThreadChatBox } from './-components/Thread.tsx';

export const Route = createFileRoute('/threads/')({
  component: RouteComponent,
});

function RouteComponent() {
  const manager = useCurrentManager();
  const navigate = Route.useNavigate();

  const onCreated = useCallback(
    ({ threadId }: { threadId: TThreadId }) => {
      void navigate({ to: '/threads/$threadId', params: { threadId } });
    },
    [navigate],
  );

  return (
    <div className="flex min-h-full w-full flex-col items-center justify-center gap-4">
      <div className="ak-layer-pop-[0.7] w-full max-w-[50rem] rounded-lg p-2.5">
        <Thread onCreated={onCreated} manager={manager}>
          <div className="ak-layer rounded-md border-[0.5px] px-4 shadow-2xs">
            <ThreadChatBox />
          </div>
        </Thread>
      </div>
    </div>
  );
}
