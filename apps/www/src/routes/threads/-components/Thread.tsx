import { useChat, type UseChatHelpers } from '@ai-sdk/react';
import { faArrowUp, faExclamationCircle, faSpinner, faStop } from '@fortawesome/free-solid-svg-icons';
import { Avatar, Button, createContext, Icon, tn, type TW_STR, twMerge } from '@libs/ui-primitives';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { ReactNode } from '@tanstack/react-router';
import { type ToolInvocation, type UIMessage } from 'ai';
import { observer } from 'mobx-react-lite';
import {
  type CSSProperties,
  type FormEvent,
  type KeyboardEvent,
  type RefObject,
  useCallback,
  useMemo,
  useState,
} from 'react';
import TextareaAutosize from 'react-textarea-autosize';

import { Markdown } from '~/components/Markdown.tsx';
import { useCurrentManager } from '~/hooks/use-current-manager.tsx';
import { useRootStore } from '~/hooks/use-root-store.tsx';
import { useScrollToBottom } from '~/hooks/use-scroll-to-bottom.tsx';
import { ThreadId, type TThreadId } from '~/utils/ids.ts';
import { queryOptions } from '~/utils/query-options.ts';

export type ThreadProps = {
  children: ReactNode;
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
  ({ threadId: providedThreadId, children, onCreated, initialMessages, scrollContainerRef }: ThreadProps) => {
    const { app, queryClient } = useRootStore();
    const { manager, conductor } = useCurrentManager();

    const isNewThread = !providedThreadId;
    const threadId = useMemo(() => providedThreadId ?? ThreadId.generate(), [providedThreadId]);

    const { containerRef, endRef, scrollToBottom } = useScrollToBottom({
      resetKey: threadId,
      scrollContainerRef,
      graceAmount: app.chatboxHeight,
    });

    const generateTitle = async (messages: UIMessage[]) => {
      try {
        const title = await conductor.generateTitle({ messages });
        if (title) {
          await manager.threads.update({ id: threadId }, { name: title });
          void queryClient.invalidateQueries({ queryKey: queryOptions.threads().queryKey });
        }
      } catch (error) {
        console.error('Error generating thread name', error);
      }
    };

    const chat = useChat({
      id: threadId,
      initialMessages,
      sendExtraMessageFields: true,
      onError(error) {
        // @TODO error handling
        console.error('Error in thread', error);
      },
      fetch: async (input, init) => {
        const body = JSON.parse(init?.body) as { id: TThreadId; messages: UIMessage[] };
        const message = body.messages[body.messages.length - 1]!;
        const history = body.messages.slice(0, -1);

        // If this is the first message, attempt to generate a title
        if (!history.length) {
          // Intentionally not blocking on this call
          void generateTitle([message]);
        }

        return conductor.handleMessage({
          clientId: app.currentUserId,
          message,
          history,
          onError: error => {
            console.error('Error in thread', error);
            // @TODO error handling
            alert('Error in thread, see console for details');
          },
          onFinish: async opts => {
            const { response } = opts;
            const thread = await manager.threads.get({ id: threadId });
            if (thread) {
              await thread.addResponseMessages({
                originalMessages: [...history, message],
                responseMessages: response.messages,
              });
            } else {
              console.warn('Thread not found in conductorRun onFinish', { clientId: app.currentUserId, threadId });
            }
          },
        });
      },
    });

    const { mutateAsync: createThread } = useMutation({
      mutationFn: manager.threads.create,
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: queryOptions.threads().queryKey });
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
          <ThreadMessage key={message.id} lineNumber={index + 1} isFirst={index === 0} message={message} />
        ))}
      </div>
      <div ref={messagesEndRef} />
    </>
  );
};

const ThreadMessage = ({
  message,
  lineNumber,
  isFirst,
}: {
  message: UIMessage;
  lineNumber: number;
  isFirst: boolean;
}) => {
  const { role, parts } = message;

  const classes = tn('ml-12', !isFirst && 'ak-edge/2 border-t-[0.5px]');

  const containerClasses = tn(
    'relative flex h-full py-14 pr-12',
    role === 'user' && 'ak-text-secondary/80',
    role === 'assistant' && 'ak-text/80',
  );

  const contentClasses = tn('mx-auto flex w-full max-w-[60rem] flex-col gap-6 leading-relaxed');

  return (
    <div className={classes}>
      <div className={containerClasses}>
        {lineNumber > 1 ? (
          <div className="ak-layer-0 ak-edge/2 absolute top-0 left-0 z-10 -translate-x-1/2 -translate-y-1/2 cursor-default rounded-xs border-[0.5px] px-1 text-sm font-light">
            <div className="opacity-60">{lineNumber}</div>
          </div>
        ) : null}

        <div className={contentClasses}>
          {parts.map((p, i) => {
            if (p.type === 'text' && p.text) {
              return <Markdown key={i} content={p.text} className="min-w-0 flex-1" />;
            }

            if (p.type === 'tool-invocation') {
              return <ToolInvocationPart key={p.toolInvocation.toolCallId} toolInvocation={p.toolInvocation} />;
            }

            return null;
          })}
        </div>
      </div>
    </div>
  );
};

const ToolInvocationPart = ({ toolInvocation }: { toolInvocation: ToolInvocation }) => {
  const { state, args } = toolInvocation;
  const { app } = useRootStore();
  const { manager } = useCurrentManager();

  const [expanded, setExpanded] = useState(false);

  const [serverId, toolName] = toolInvocation.toolName.split('__');

  const { data: servers } = useQuery({
    ...queryOptions.servers(),
    queryFn: () => manager.servers.findMany(),
  });

  const server = servers?.find(s => s.id === serverId);

  if (server) {
    const icon = app.currentThemeId === 'light' ? server.presentation?.icon?.light : server.presentation?.icon?.dark;
    const iconElem = icon ? (
      <img src={icon} alt={server.name} className="ak-frame-xs h-block-xs w-block-xs" />
    ) : (
      <Avatar name={server.name} size="xs" />
    );

    const result =
      state === 'result'
        ? (toolInvocation.result as { isError?: true; content: { type: 'text'; text: string }[] })
        : null;

    const contentClasses = tn('ak-frame -mx-1.5 divide-y-[0.5px] border-[0.5px] text-xs', expanded ? '' : 'w-fit');

    let expandedElem;
    if (expanded) {
      expandedElem = (
        <>
          <Markdown
            unstyledCodeBlocks
            content={`
\`\`\`json title="tool args"
${JSON.stringify(args || {}, null, 2)}
\`\`\``}
          />

          <Markdown
            unstyledCodeBlocks
            content={`
\`\`\`json title="tool result"
${JSON.stringify(JSON.parse(result?.content[0]?.text || '{}'), null, 2)}
\`\`\`
`}
          />
        </>
      );
    }

    return (
      <div className={contentClasses}>
        <div
          className="flex cursor-pointer items-center gap-3 py-2 pr-3 pl-2"
          onClick={() => setExpanded(prev => !prev)}
        >
          {iconElem}

          <div>
            {server.name} / {toolName}
          </div>

          {state !== 'result' ? (
            <div>
              <Icon icon={faSpinner} spin />
            </div>
          ) : null}

          {result?.isError ? (
            <div className="ak-text-danger">
              <Icon icon={faExclamationCircle} />
            </div>
          ) : null}
        </div>

        {expandedElem}
      </div>
    );
  }

  // Only showing server tool invocations for now
  return null;
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

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (disabled) return;

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent<HTMLFormElement>);
    }
  };

  const isStreaming = chat.status === 'submitted' || chat.status === 'streaming';

  return (
    <>
      {chat.error ? <div className="ak-text-danger pt-3 text-xs">{chat.error.message}</div> : null}
      <form className={twMerge('flex w-full items-center gap-3', className)} onSubmit={handleSubmit}>
        <TextareaAutosize
          id="message"
          name="message"
          placeholder="Ask anything"
          className={twMerge(
            'caret-secondary focus:placeholder:ak-text-secondary max-h-[30rem] flex-1 resize-none py-5 pl-2 focus:outline-none',
            inputClassName,
          )}
          value={chat.input}
          onChange={chat.handleInputChange}
          onKeyDown={onKeyDown}
          autoComplete="off"
          disabled={isStreaming}
          autoFocus
        />

        {isStreaming ? (
          <Button icon={faStop} variant="solid" intent="danger" onClick={() => chat.stop()} />
        ) : (
          <Button type="submit" icon={faArrowUp} variant="solid" intent="primary" disabled={!chat.input} />
        )}
      </form>
    </>
  );
};
