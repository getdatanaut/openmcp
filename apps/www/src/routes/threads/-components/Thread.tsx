import { useChat, type UseChatHelpers } from '@ai-sdk/react';
import type { ReasoningUIPart } from '@ai-sdk/ui-utils';
import {
  faArrowUp,
  faChevronDown,
  faChevronRight,
  faExclamationCircle,
  faSpinner,
  faStop,
} from '@fortawesome/free-solid-svg-icons';
import { Avatar, Button, createContext, Icon, tn, type TW_STR, twMerge } from '@libs/ui-primitives';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { ReactNode } from '@tanstack/react-router';
import { type LanguageModelUsage, type Message, type ToolInvocation, type UIMessage } from 'ai';
import { observer } from 'mobx-react-lite';
import {
  type CSSProperties,
  type FormEvent,
  type KeyboardEvent,
  memo,
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import TextareaAutosize from 'react-textarea-autosize';

import { Markdown } from '~/components/Markdown.tsx';
import { useCurrentManager } from '~/hooks/use-current-manager.ts';
import { useRootStore } from '~/hooks/use-root-store.tsx';
import { useScrollToBottom } from '~/hooks/use-scroll-to-bottom.tsx';
import {
  isReasoningAnnotation,
  isUsageAnnotation,
  type McpConductorReasoningFinishAnnotation,
  type McpConductorReasoningStartAnnotation,
} from '~/utils/conductor/annotations.ts';
import { dayjs } from '~/utils/dayjs.ts';
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

const messageUsage = (message: Message) => {
  return message.annotations?.reduce(
    (acc: LanguageModelUsage, annotation) => {
      if (isUsageAnnotation(annotation)) {
        return {
          totalTokens: acc.totalTokens + (annotation.usage?.totalTokens || 0),
          promptTokens: acc.promptTokens + (annotation.usage?.promptTokens || 0),
          completionTokens: acc.completionTokens + (annotation.usage?.completionTokens || 0),
        };
      }

      return acc;
    },
    { totalTokens: 0, promptTokens: 0, completionTokens: 0 },
  );
};

const reasoningStart = (message: Message, stepIndex: number) => {
  return message.annotations?.find(
    annotation =>
      isReasoningAnnotation(annotation) && annotation.type === 'reasoning-start' && annotation.stepIndex === stepIndex,
  ) as McpConductorReasoningStartAnnotation | undefined;
};

const reasoningFinish = (message: Message, stepIndex: number) => {
  return message.annotations?.find(
    annotation =>
      isReasoningAnnotation(annotation) && annotation.type === 'reasoning-finish' && annotation.stepIndex === stepIndex,
  ) as McpConductorReasoningFinishAnnotation | undefined;
};

export const Thread = observer(
  ({ threadId: providedThreadId, children, onCreated, initialMessages, scrollContainerRef }: ThreadProps) => {
    const { app, queryClient } = useRootStore();
    const { conductor, threadManager } = useCurrentManager();

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
          await threadManager.update({ id: threadId }, { name: title });
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
      // experimental_throttle: 2000,
      onError(error) {
        // @TODO error handling
        console.error('Error in thread');
        console.log(error);
      },

      onFinish: async (message, opts) => {
        console.log('Thread.chat.onFinish', { message, opts });

        const thread = await threadManager.get({ id: threadId });
        if (!thread) {
          console.warn('Thread not found in chat.onFinish', { clientId: app.currentUserId, threadId });
          return;
        }

        await thread.addMessage(message, { usage: messageUsage(message) });

        void queryClient.invalidateQueries({ queryKey: queryOptions.thread({ threadId }).queryKey });
      },

      fetch: async (_input, init) => {
        const body = JSON.parse(init?.body) as { id: TThreadId; messages: UIMessage[] };
        const message = body.messages[body.messages.length - 1]!;
        const history = body.messages.slice(0, -1);

        // If this is the first message, attempt to generate a title
        if (!history.length) {
          // Intentionally not blocking on this call
          void generateTitle([message]);
        }

        console.log('Thread.chat.fetch', { message, history });

        const thread = await threadManager.get({ id: threadId });
        if (!thread) {
          console.warn('Thread not found in chat.fetch', { clientId: app.currentUserId, threadId });
          return new Response('Thread not found', { status: 404 });
        }

        // Save the user's new message
        await thread.addMessage(message);

        return conductor.handleMessage({
          clientId: app.currentUserId,
          message,
          history,
        });
      },
    });

    const { mutateAsync: createThread } = useMutation({
      mutationFn: threadManager.create,
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
          <ThreadMessage
            key={message.id}
            lineNumber={index + 1}
            isFirst={index === 0}
            message={message}
            status={chat.status}
          />
        ))}
      </div>
      <div ref={messagesEndRef} />
    </>
  );
};

const ThreadMessage = memo(
  ({
    message,
    lineNumber,
    isFirst,
    status,
  }: {
    message: UIMessage;
    lineNumber: number;
    isFirst: boolean;
    status: UseChatHelpers['status'];
  }) => {
    const { role, parts } = message;

    const usage = messageUsage(message);

    const classes = tn('group ml-12', !isFirst && 'ak-edge/2 border-t-[0.5px]');

    // useEffect(() => {
    //   console.log('ThreadMessage.useEffect', lineNumber, message);
    // }, [JSON.stringify(message), lineNumber]);

    const containerClasses = tn(
      'relative flex h-full py-14 pr-12',
      role === 'user' && 'ak-text-secondary/80',
      role === 'assistant' && 'ak-text/80',
    );

    const contentClasses = tn('mx-auto flex w-full max-w-[60rem] flex-col gap-6 leading-relaxed');

    let stepIndex = -1;

    return (
      <div className={classes}>
        <div className={containerClasses}>
          {!isFirst ? (
            <div className="ak-layer-0 ak-edge/2 absolute top-0 left-0 z-10 -translate-x-1/2 -translate-y-1/2 cursor-default rounded-xs border-[0.5px] px-1 text-sm font-light">
              <div className="opacity-60">{lineNumber}</div>
            </div>
          ) : null}

          <div className={contentClasses}>
            {parts.map((p, i) => {
              if (p.type === 'step-start') {
                stepIndex++;
              }

              if (p.type === 'text' && p.text) {
                return <Markdown key={i} content={p.text} className="min-w-0 flex-1" />;
              }

              if (p.type === 'tool-invocation') {
                return <ToolInvocationPart key={p.toolInvocation.toolCallId} toolInvocation={p.toolInvocation} />;
              }

              if (p.type === 'reasoning') {
                return (
                  <ReasoningMessagePart
                    key={i}
                    part={p}
                    isReasoning={status === 'streaming' && i === parts.length - 1}
                    reasoningStart={reasoningStart(message, stepIndex)}
                    reasoningFinish={reasoningFinish(message, stepIndex)}
                  />
                );
              }

              return null;
            })}
          </div>

          {!isFirst ? (
            <div className="text-2xs invisible absolute top-0 right-3 -mt-px flex -translate-y-1/2 gap-2 group-hover:visible">
              {usage?.totalTokens && (
                <div className="ak-layer-0 ak-text/40 px-1.5">{formatNumberWithCommas(usage.totalTokens)} Tokens</div>
              )}
              {message.createdAt && (
                <div className="ak-layer-0 ak-text/40 px-1.5" title={dayjs(message.createdAt).format('MMM D h:mm a')}>
                  {dayjs(message.createdAt).fromNow()}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    );
  },
);

interface MPCResponse {
  isError?: true;
  content: { type: 'text'; text: string }[];
}

const isMcpResponse = (response: unknown): response is MPCResponse => {
  return typeof response === 'object' && response !== null && 'content' in response && Array.isArray(response.content);
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
  if (!server) {
    // Only showing server tool invocations for now
    return null;
  }

  const icon = app.currentThemeId === 'light' ? server.presentation?.icon?.light : server.presentation?.icon?.dark;
  const iconElem = icon ? (
    <img src={icon} alt={server.name} className="ak-frame-xs h-block-xs w-block-xs" />
  ) : (
    <Avatar name={server.name} size="xs" />
  );

  const result = state === 'result' ? (toolInvocation.result as MPCResponse | unknown) : null;

  const contentClasses = tn('ak-frame -mx-1.5 divide-y-[0.5px] border-[0.5px] text-xs', expanded ? '' : 'w-fit');

  let expandedElem;
  if (expanded) {
    expandedElem = (
      <>
        <Markdown
          unstyledCodeBlocks
          content={`
\`\`\`json title="tool input"
${JSON.stringify(args || {}, null, 2)}
\`\`\``}
        />

        <Markdown
          unstyledCodeBlocks
          content={`
\`\`\`json title="tool output"
${JSON.stringify(isMcpResponse(result) ? JSON.parse(result?.content?.[0]?.text || '{}') : result, null, 2)}
\`\`\`
`}
        />
      </>
    );
  }

  return (
    <div className={contentClasses}>
      <div className="flex cursor-pointer items-center gap-3 py-2 pr-3 pl-2" onClick={() => setExpanded(prev => !prev)}>
        {iconElem}

        <div>
          {server.name} / {toolName}
        </div>

        {state !== 'result' ? (
          <div>
            <Icon icon={faSpinner} spin />
          </div>
        ) : null}

        {isMcpResponse(result) && result?.isError ? (
          <div className="ak-text-danger">
            <Icon icon={faExclamationCircle} />
          </div>
        ) : null}
      </div>

      {expandedElem}
    </div>
  );
};

const ReasoningMessagePart = ({
  part,
  isReasoning,
  reasoningStart,
  reasoningFinish,
}: {
  part: ReasoningUIPart;
  isReasoning: boolean;
  reasoningStart?: McpConductorReasoningStartAnnotation;
  reasoningFinish?: McpConductorReasoningFinishAnnotation;
}) => {
  const [expanded, setExpanded] = useState(isReasoning);

  let expandedElem;
  if (expanded) {
    expandedElem = (
      <div className="ak-text/50 ml-1 border-l-[0.5px] pl-4 text-xs">
        <div className="max-h-[20rem] overflow-auto">
          {part.details.map((detail, i) =>
            detail.type === 'text' ? <Markdown key={i} content={detail.text} /> : '<redacted>',
          )}
        </div>
      </div>
    );
  }

  const icon = isReasoning ? faSpinner : expanded ? faChevronDown : faChevronRight;

  useEffect(() => {
    if (!isReasoning) {
      setExpanded(false);
    }
  }, [isReasoning]);

  const titleParts = [
    reasoningStart?.name || 'Planner',
    isReasoning
      ? 'thinking...'
      : `thought for ${reasoningFinish?.duration ? dayjs.duration(reasoningFinish?.duration).humanize() : 'a bit'}`,
  ];

  return (
    <div className="-ml-0.5 flex flex-col gap-2">
      <div className="flex cursor-pointer items-center gap-2.5 text-xs" onClick={() => setExpanded(prev => !prev)}>
        <div>
          <Icon icon={icon} className="text-[0.8em]" spin={isReasoning} fw />
        </div>
        <div>{titleParts.filter(Boolean).join(': ')}</div>
      </div>

      {expandedElem}
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
      {chat.error ? (
        <div className="ak-text-danger max-h-[20rem] overflow-auto pt-3 text-xs">{chat.error.message}</div>
      ) : null}
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

const formatNumberWithCommas = (num: number) => {
  return num.toLocaleString('en-US', {
    maximumFractionDigits: 0,
  });
};
