import { createOpenAI } from '@ai-sdk/openai';
import { useChat, type UseChatHelpers } from '@ai-sdk/react';
import { faArrowUp } from '@fortawesome/free-solid-svg-icons';
import { Button, createContext, tn } from '@libs/ui-primitives';
import { Markdown } from '@libs/ui-primitives/markdown';
import type { Manager } from '@openmcp/manager';
import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from '@tanstack/react-router';
import { streamText, type UIMessage } from 'ai';
import { observer } from 'mobx-react-lite';
import { useCallback, useMemo } from 'react';
import { type FormEvent, type KeyboardEvent } from 'react';

import { useRootStore } from '~/hooks/use-root-store.ts';
import { ThreadId, type TThreadId } from '~/utils/ids.ts';

export type ThreadProps = {
  children: ReactNode;
  manager: Manager;
  loadingFallback?: ReactNode;
  threadId?: TThreadId;
  onCreated?: (props: { threadId: TThreadId }) => void;
};

const openai = createOpenAI({
  // @ts-expect-error temporary
  apiKey: import.meta.env.VITE_OPENAI_SECRET,
});

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

export const ThreadInner = ({
  isNewThread,
  threadId,
  children,
  manager,
  onCreated,
  initialMessages,
}: ThreadInnerProps) => {
  const chat = useChat({
    id: threadId,
    initialMessages,
    api: '/does/not/matter',
    sendExtraMessageFields: true,
    fetch: async (input, init) => {
      const body = JSON.parse(init?.body) as { id: TThreadId; messages: UIMessage[] };
      return conductorRun({ threadId, messages: body.messages, manager });
    },
  });

  const handleSubmit = useCallback(
    async e => {
      e.preventDefault();
      if (isNewThread) {
        await manager.threads.create({ id: threadId, clientId: 'test', name: 'New Chat' });
        onCreated?.({ threadId });
      }

      chat.handleSubmit(e);
    },
    [manager.threads.create, chat.handleSubmit, threadId, isNewThread],
  );

  return <ThreadContext.Provider value={{ threadId, chat, handleSubmit }}>{children}</ThreadContext.Provider>;
};

// @TODO this will ultimately be in the manager
const conductorRun = ({
  threadId,
  messages,
  manager,
}: {
  threadId: string;
  messages: UIMessage[];
  manager: Manager;
}) => {
  const result = streamText({
    model: openai('gpt-4-turbo'),
    system: 'You are a helpful assistant.',
    messages,
    async onFinish({ response }) {
      const thread = await manager.threads.get({ id: threadId });
      if (!thread) {
        console.warn('Thread not found in conductorRun onFinish', threadId);
        return;
      }

      void thread.addResponseMessages({
        originalMessages: messages,
        responseMessages: response.messages,
      });
    },
  });

  return result.toDataStreamResponse();
};

export const ThreadMessages = () => {
  const { chat } = useThreadContext();

  return (
    <div className="flex flex-col divide-y-[0.5px]">
      {chat.messages.map((message, index) => (
        <ThreadMessage key={index} lineNumber={index + 1} {...message} />
      ))}
    </div>
  );
};

const ThreadMessage = observer(
  ({
    content,
    role,
    isActive,
    lineNumber,
  }: UIMessage & {
    isActive?: boolean;
    lineNumber: number;
  }) => {
    const { app } = useRootStore();
    const classes = tn('hover:ak-layer-[0.2] px-14');

    const containerClasses = tn(
      'relative flex border-l-[0.5px] py-14',
      role === 'user' && 'ak-text-secondary/70',
      role === 'assistant' && 'ak-text/80',
    );

    const contentClasses = tn('mx-auto w-full max-w-[50rem] leading-relaxed');

    return (
      <div className={classes}>
        <div className={containerClasses}>
          {lineNumber > 1 ? (
            <div className="ak-layer-0 absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 border-[0.5px] px-1 text-sm font-light">
              <div className="opacity-60">{lineNumber}</div>
            </div>
          ) : null}

          <div className={contentClasses}>
            <div className="dn-prose min-w-0 flex-1">
              <Markdown codeTheme={app.theme?.codeTheme ?? 'github-dark'} content={content} />
            </div>
          </div>
        </div>
      </div>
    );
  },
);

export const ThreadChatBox = ({ disabled }: { disabled?: boolean }) => {
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
    <form className="flex w-full items-center gap-3 pr-5" onSubmit={handleSubmit}>
      <input
        id="message"
        name="message"
        type="text"
        placeholder="Ask anything"
        className="caret-secondary flex-1 py-6 pl-6 focus:outline-none"
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
