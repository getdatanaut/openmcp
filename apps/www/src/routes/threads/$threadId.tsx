import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { Button, tn } from '@libs/ui-primitives';
import { createFileRoute, Link } from '@tanstack/react-router';
import { observer } from 'mobx-react-lite';
import { type Ref, type RefObject, useEffect, useRef } from 'react';

import { useCurrentManager } from '~/hooks/use-current-manager.tsx';
import { useElementSize } from '~/hooks/use-element-size.tsx';
import { useRootStore } from '~/hooks/use-root-store.tsx';
import { ThreadId } from '~/utils/ids.ts';

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

function ThreadRoute() {
  return <ThreadRouteComponent />;
}

const ThreadRouteComponent = observer(() => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex h-screen flex-1 flex-col overflow-y-auto" ref={scrollContainerRef}>
      <div className="ak-layer-0 sticky top-0 z-10 flex h-12 shrink-0 items-center border-b-[0.5px]">
        <div className="flex h-full w-12 items-center justify-center" />

        <div className="flex h-full flex-1 items-center gap-4 border-l-[0.5px] px-4">
          <div className="text-sm opacity-75">New Thread</div>

          <Button
            icon={faPlus}
            size="xs"
            variant="outline"
            className="ml-auto"
            render={<Link to="/threads" activeOptions={{ exact: true }} />}
          >
            Thread
          </Button>
        </div>
      </div>

      <ThreadWrapper scrollContainerRef={scrollContainerRef} />
    </div>
  );
});

const ThreadWrapper = observer(({ scrollContainerRef }: { scrollContainerRef: RefObject<HTMLDivElement | null> }) => {
  const { threadId } = Route.useParams();
  const manager = useCurrentManager();
  const { app } = useRootStore();

  return (
    <Thread manager={manager} threadId={threadId} scrollContainerRef={scrollContainerRef}>
      <ThreadMessages style={{ paddingBottom: app.chatboxHeight }} />
      <ThreadChatBoxWrapper />
    </Thread>
  );
});

const ThreadChatBoxWrapper = observer(() => {
  const { app } = useRootStore();

  const [ref, { height }] = useElementSize();

  useEffect(() => {
    app.setChatboxHeight(height);
  }, [height, app]);

  return (
    <div
      className="ak-layer-pop-[0.7] fixed bottom-0 w-full max-w-[60rem] rounded-t-lg px-2.5 pt-2.5"
      ref={ref}
      style={{
        left: '50%',
        transform: `translateX(calc(-50% - ${app.sidebarWidth / 2}px))`,
      }}
    >
      <div className="ak-layer mx-auto rounded-t-md border-x-[0.5px] border-t-[0.5px] px-4 shadow-sm">
        <ThreadChatBox />
      </div>
    </div>
  );
});
