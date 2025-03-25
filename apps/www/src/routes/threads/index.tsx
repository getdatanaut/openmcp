import { createFileRoute } from '@tanstack/react-router';
import { useCallback } from 'react';

import { CanvasLayout } from '~/components/CanvasLayout.tsx';
import { type TThreadId } from '~/utils/ids.ts';

import { Thread, ThreadChatBox } from './-components/Thread.tsx';

export const Route = createFileRoute('/threads/')({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = Route.useNavigate();

  const onCreated = useCallback(
    ({ threadId }: { threadId: TThreadId }) => {
      void navigate({ to: '/threads/$threadId', params: { threadId } });
    },
    [navigate],
  );

  return (
    <CanvasLayout>
      <div className="flex min-h-full w-full flex-col items-center justify-center gap-4">
        <div className="ak-layer-pop-[0.7] w-full max-w-[50rem] rounded-lg p-2.5">
          <Thread onCreated={onCreated}>
            <div className="ak-layer rounded-md border-[0.5px] px-4 shadow-2xs">
              <ThreadChatBox />
            </div>
          </Thread>
        </div>
      </div>
    </CanvasLayout>
  );
}
