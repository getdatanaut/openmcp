import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { Button } from '@libs/ui-primitives';
import { createFileRoute, Link } from '@tanstack/react-router';
import { observer } from 'mobx-react-lite';

import { useCurrentManager } from '~/hooks/use-current-manager.ts';
import { ThreadId } from '~/utils/ids.ts';
import { generateMockConversation } from '~/utils/mocks.ts';

import { Thread, ThreadChatBox, ThreadMessages } from './-components/Thread.tsx';

export const Route = createFileRoute('/threads/$threadId')({
  component: ThreadRoute,
  params: {
    parse: params => {
      return {
        threadId: ThreadId.validator.parse(params.threadId),
      };
    },
  },
});

const mockConversation = generateMockConversation();

function ThreadRoute() {
  return <ThreadRouteComponent />;
}

const ThreadRouteComponent = () => {
  return (
    <div className="h-screen flex-1 overflow-y-auto">
      <div className="ak-layer-0 sticky top-0 z-10 flex h-12 items-center border-b-[0.5px]">
        <div className="flex h-full w-14 items-center justify-center">
          <Button icon={faPlus} size="xs" variant="solid" intent="primary" render={<Link to="/threads" />} />
        </div>

        <div className="flex h-full flex-1 items-center gap-4 border-l-[0.5px] px-4">
          <div className="mx-auto text-sm">{mockConversation.name}</div>
        </div>
      </div>

      <ThreadWrapper />
    </div>
  );
};

const ThreadWrapper = observer(() => {
  const { threadId } = Route.useParams();
  const manager = useCurrentManager();

  return (
    <div className="flex-1 pr-px">
      <Thread
        manager={manager}
        threadId={threadId}
        loadingFallback={
          <div className="flex min-h-screen w-full items-center justify-center opacity-50">Loading...</div>
        }
      >
        <ThreadMessages />
        <div className="ak-layer-[down-0.4] sticky bottom-0 border-t-[0.5px]">
          <div className="mx-auto max-w-[50rem]">
            <ThreadChatBox />
          </div>
        </div>
      </Thread>
    </div>
  );
});
