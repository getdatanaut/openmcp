import { useChat, type UseChatHelpers } from '@ai-sdk/react';
import { faArrowUp } from '@fortawesome/free-solid-svg-icons';
import { Button, createContext, tn, type TW_STR, twMerge } from '@libs/ui-primitives';
import type { MpcManager } from '@openmcp/manager';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ReactNode } from '@tanstack/react-router';
import { type UIMessage } from 'ai';
import { observer } from 'mobx-react-lite';
import { type CSSProperties, type FormEvent, type KeyboardEvent, type RefObject, useCallback, useMemo } from 'react';
import TextareaAutosize from 'react-textarea-autosize';

import { Markdown } from '~/components/Markdown.tsx';
import { useRootStore } from '~/hooks/use-root-store.tsx';
import { useScrollToBottom } from '~/hooks/use-scroll-to-bottom.tsx';
import { ThreadId, type TThreadId } from '~/utils/ids.ts';

export type ThreadProps = {
  children: ReactNode;
  manager: MpcManager;
  threadId?: TThreadId;
  initialMessages?: UIMessage[];
  scrollContainerRef?: RefObject<HTMLDivElement | null>;
  onCreated?: (props: { threadId: TThreadId }) => void;
};

interface ThreadContextProps {
  threadId: TThreadId;
  chat: UseChatHelpers;
  scrollContainerRef?: RefObject<HTMLDivElement | null>;
  messagesContainerRef?: RefObject<HTMLDivElement | null>;
  messagesEndRef?: RefObject<HTMLDivElement | null>;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

const [ThreadContext, useThreadContext] = createContext<ThreadContextProps>({
  name: 'ThreadContext',
  strict: true,
});

export const Thread = observer(
  ({ threadId: providedThreadId, children, manager, onCreated, initialMessages, scrollContainerRef }: ThreadProps) => {
    const { app } = useRootStore();
    const queryClient = useQueryClient();

    const isNewThread = !providedThreadId;
    const threadId = useMemo(() => providedThreadId ?? ThreadId.generate(), [providedThreadId]);

    const { containerRef, endRef, scrollToBottom } = useScrollToBottom({
      resetKey: threadId,
      scrollContainerRef,
      graceAmount: app.chatboxHeight,
    });

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

        // When user submits a message, all good to start scrolling again
        scrollToBottom();

        chat.handleSubmit(e);
      },
      [isNewThread, scrollToBottom, chat, createThread, threadId, app.currentUserId, onCreated],
    );

    return (
      <ThreadContext.Provider
        value={{ threadId, chat, handleSubmit, messagesContainerRef: containerRef, messagesEndRef: endRef }}
      >
        {children}
      </ThreadContext.Provider>
    );
  },
);

export const ThreadMessages = ({ className, style }: { className?: string; style?: CSSProperties }) => {
  const { chat, messagesContainerRef, messagesEndRef } = useThreadContext();

  return (
    <>
      <div className={twMerge('flex flex-1 flex-col', className)} style={style} ref={messagesContainerRef}>
        {chat.messages.map((message, index) => (
          <ThreadMessage key={index} lineNumber={index + 1} isFirst={index === 0} {...message} />
        ))}
      </div>
      <div ref={messagesEndRef} />
    </>
  );
};

const ThreadMessage = ({
  content,
  role,
  isActive,
  lineNumber,
  isFirst,
}: UIMessage & {
  isActive?: boolean;
  lineNumber: number;
  isFirst: boolean;
}) => {
  const classes = tn('ml-12', !isFirst && 'ak-edge/2 border-t-[0.5px]');

  const containerClasses = tn(
    'relative flex h-full py-14 pr-12',
    role === 'user' && 'ak-text-secondary/80',
    role === 'assistant' && 'ak-text/80',
  );

  const contentClasses = tn('mx-auto w-full max-w-[60rem] leading-relaxed');

  return (
    <div className={classes}>
      <div className={containerClasses}>
        {lineNumber > 1 ? (
          <div className="ak-layer-0 ak-edge/2 absolute top-0 left-0 z-10 -translate-x-1/2 -translate-y-1/2 cursor-default rounded-xs border-[0.5px] px-1 text-sm font-light">
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

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (disabled) return;

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent<HTMLFormElement>);
    }
  };

  return (
    <form className={twMerge('flex w-full items-center gap-3', className)} onSubmit={handleSubmit}>
      <TextareaAutosize
        id="message"
        name="message"
        placeholder="Ask anything"
        className={twMerge(
          'caret-secondary focus:placeholder:ak-text-secondary max-h-[30rem] flex-1 resize-none py-5 pl-2 focus:outline-none',
          inputClassName,
        )}
        value={value}
        onChange={chat.handleInputChange}
        onKeyDown={onKeyDown}
        autoComplete="off"
        autoFocus
      />

      <Button type="submit" icon={faArrowUp} variant="solid" intent="primary" disabled={!value} />
    </form>
  );
};
