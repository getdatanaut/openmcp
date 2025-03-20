import { useChat, type UseChatHelpers } from '@ai-sdk/react';
import { faArrowUp } from '@fortawesome/free-solid-svg-icons';
import { Button, createContext, tn, type TW_STR, twMerge } from '@libs/ui-primitives';
import type { MpcManager } from '@openmcp/manager';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ReactNode } from '@tanstack/react-router';
import { type UIMessage } from 'ai';
import { observer } from 'mobx-react-lite';
import { useCallback, useMemo } from 'react';
import { type FormEvent, type KeyboardEvent } from 'react';

import { Markdown } from '~/components/Markdown.tsx';
import { useRootStore } from '~/hooks/use-root-store.tsx';
import { ThreadId, type TThreadId } from '~/utils/ids.ts';

export type ThreadProps = {
  children: ReactNode;
  manager: MpcManager;
  loadingFallback?: ReactNode;
  threadId?: TThreadId;
  onCreated?: (props: { threadId: TThreadId }) => void;
};

interface ThreadContextProps {
  threadId: TThreadId;
  chat: UseChatHelpers;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

const [ThreadContext, useThreadContext] = createContext<ThreadContextProps>({
  name: 'ThreadContext',
  strict: true,
});

export const Thread = ({ threadId: providedThreadId, ...rest }: ThreadProps) => {
  const isNewThread = !providedThreadId;
  const threadId = useMemo(() => providedThreadId ?? ThreadId.generate(), [providedThreadId]);

  const { data: messages, isPending } = useQuery({
    queryKey: ['thread', threadId, 'messages'],
    queryFn: async () => {
      const msgs = await rest.manager.threads.listMessages({ id: threadId });
      return msgs.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
    },
    enabled: !isNewThread,
  });

  if (!isNewThread && isPending) {
    return rest.loadingFallback;
  }

  return <ThreadInner isNewThread={isNewThread} threadId={threadId} initialMessages={messages} {...rest} />;
};

export interface ThreadInnerProps extends Omit<ThreadProps, 'threadId' | 'loadingFallback'> {
  isNewThread?: boolean;
  threadId: TThreadId;
  initialMessages?: UIMessage[];
}

export const ThreadInner = observer(
  ({ isNewThread, threadId, children, manager, onCreated, initialMessages }: ThreadInnerProps) => {
    const { app } = useRootStore();
    const queryClient = useQueryClient();

    const chat = useChat({
      id: threadId,
      initialMessages,
      sendExtraMessageFields: true,
      onError(error) {
        console.error('Error in thread', error);
        // @TODO error handling
        alert('Error in thread, see console for details');
      },
      fetch: async (input, init) => {
        const body = JSON.parse(init?.body) as { id: TThreadId; messages: UIMessage[] };
        const message = body.messages[body.messages.length - 1]!;
        const history = body.messages.slice(0, -1);

        return manager.conductor.handleMessage({
          clientId: app.currentUserId,
          threadId,
          message,
          history,
        });
      },
    });

    const { mutateAsync: createThread } = useMutation({
      mutationFn: manager.threads.create,
      onSuccess: () => {
        // @TODO rework react query usage to consolidate query options into one spot, best practices
        void queryClient.invalidateQueries({ queryKey: ['threads'] });
      },
    });

    const handleSubmit = useCallback(
      async e => {
        e.preventDefault();

        if (isNewThread) {
          await createThread({
            id: threadId,
            clientId: app.currentUserId,
            name: 'New Thread',
            createdAt: new Date().toISOString(),
          });
          onCreated?.({ threadId });
        }

        chat.handleSubmit(e);
      },
      [createThread, chat.handleSubmit, threadId, isNewThread, app.currentUserId],
    );

    return <ThreadContext.Provider value={{ threadId, chat, handleSubmit }}>{children}</ThreadContext.Provider>;
  },
);

export const ThreadMessages = () => {
  const { chat } = useThreadContext();

  return (
    <div className="flex flex-1 flex-col divide-y-[0.5px]">
      {chat.messages.map((message, index) => (
        <ThreadMessage key={index} lineNumber={index + 1} isLast={index === chat.messages.length - 1} {...message} />
      ))}
    </div>
  );
};

const ThreadMessage = ({
  content,
  role,
  isActive,
  lineNumber,
  isLast,
}: UIMessage & {
  isActive?: boolean;
  lineNumber: number;
  isLast: boolean;
}) => {
  const classes = tn('px-12', isLast && 'flex-1');

  const containerClasses = tn(
    'relative flex h-full border-l-[0.5px] py-14',
    role === 'user' && 'ak-text-secondary/70',
    role === 'assistant' && 'ak-text/80',
  );

  const contentClasses = tn('mx-auto w-full max-w-[60rem] leading-relaxed');

  return (
    <div className={classes}>
      <div className={containerClasses}>
        {lineNumber > 1 ? (
          <div className="ak-layer-0 absolute top-1.5 left-[3px] -translate-x-1/2 -translate-y-1/2 border-[0.5px] px-1 text-sm font-light">
            <div className="opacity-60">{lineNumber}</div>
          </div>
        ) : null}

        <div className={contentClasses}>
          <Markdown content={content} className="min-w-0 flex-1" />
        </div>
      </div>
    </div>
  );
};

export const ThreadChatBox = ({
  disabled,
  inputClassName,
  className,
}: {
  disabled?: boolean;
  inputClassName?: TW_STR;
  className?: TW_STR;
}) => {
  const { chat, handleSubmit } = useThreadContext();

  const value = chat.input;

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === 'Enter' && e.metaKey) {
      e.preventDefault();
      chat.handleSubmit(e as unknown as FormEvent<HTMLFormElement>);
    }
  };

  return (
    <form className={twMerge('flex w-full items-center gap-3 pr-12', className)} onSubmit={handleSubmit}>
      <input
        id="message"
        name="message"
        type="text"
        placeholder="Ask anything"
        className={twMerge(
          'caret-secondary focus:placeholder:ak-text-secondary flex-1 py-6 pl-10 focus:outline-none',
          inputClassName,
        )}
        value={value}
        onChange={chat.handleInputChange}
        onKeyDown={onKeyDown}
        autoComplete="off"
        autoFocus
      />

      <Button type="submit" icon={faArrowUp} variant="solid" intent={value ? 'primary' : 'neutral'} disabled={!value} />
    </form>
  );
};
