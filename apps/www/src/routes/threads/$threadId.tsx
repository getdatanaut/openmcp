import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { observer } from 'mobx-react-lite';
import { type RefObject, useEffect, useRef } from 'react';

import { CanvasLayout } from '~/components/CanvasLayout.tsx';
import { useCurrentManager } from '~/hooks/use-current-manager.ts';
import { useElementSize } from '~/hooks/use-element-size.tsx';
import { useRootStore } from '~/hooks/use-root-store.tsx';
import { ThreadId } from '~/utils/ids.ts';
import { queryOptions } from '~/utils/query-options.ts';

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

const ThreadRouteComponent = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  return (
    <CanvasLayout header={<ThreadHeader />}>
      <div className="flex flex-1 flex-col overflow-y-auto" ref={scrollContainerRef}>
        <ThreadWrapper scrollContainerRef={scrollContainerRef} />
      </div>
    </CanvasLayout>
  );
};

const ThreadHeader = observer(() => {
  const { threadId } = Route.useParams();
  const { threadManager } = useCurrentManager();

  const { data: thread } = useQuery({
    ...queryOptions.thread({ threadId }),
    queryFn: () => threadManager.get({ id: threadId }),
  });

  return (
    <div className="flex flex-1 items-center">
      <div className="flex-1" />
      <div className="flex-1 text-sm opacity-75">{thread?.name || ''}</div>
      <div className="flex flex-1 items-center justify-end gap-2 divide-x-2">
        <div className="px-2 text-xs opacity-60">
          {thread?.usage
            ? `${thread?.usage.totalTokens.toLocaleString('en-US', {
                maximumFractionDigits: 0,
              })} Tokens`
            : ''}
        </div>
      </div>
    </div>
  );
});

const ThreadWrapper = observer(({ scrollContainerRef }: { scrollContainerRef: RefObject<HTMLDivElement | null> }) => {
  const { threadId } = Route.useParams();
  const { threadManager } = useCurrentManager();
  const { app } = useRootStore();

  const { data: messages, isPending } = useQuery({
    ...queryOptions.threadMessages({ threadId }),
    queryFn: async () => {
      const msgs = await threadManager.listMessages({ id: threadId });
      return msgs.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
    },
  });

  if (isPending) {
    return null;
  }

  return (
    <Thread threadId={threadId} scrollContainerRef={scrollContainerRef} initialMessages={messages}>
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
    <div className="absolute bottom-0 left-1/2 w-full max-w-[60rem] -translate-x-1/2" ref={ref}>
      <div className="ak-layer-pop-[0.5] -mx-2 w-full rounded-t-lg px-2 pt-2">
        <div className="ak-layer-[0.7] rounded-t-md border-x-[0.5px] border-t-[0.5px] px-4 shadow-xs">
          <ThreadChatBox />
        </div>
      </div>
    </div>
  );
});
