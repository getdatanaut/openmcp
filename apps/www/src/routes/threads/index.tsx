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
      <Thread onCreated={onCreated} manager={manager}>
        <div className="ak-layer-[down-0.4] sticky w-full max-w-[50rem] border">
          <ThreadChatBox className={tn('pr-4')} inputClassName={tn('pl-6')} />
        </div>
      </Thread>
    </div>
  );
}
