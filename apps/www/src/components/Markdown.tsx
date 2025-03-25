import { Markdown as MarkdownPrimitive } from '@libs/ui-primitives/markdown';
import { observer } from 'mobx-react-lite';
import { twMerge } from 'tailwind-merge';

import { useRootStore } from '~/hooks/use-root-store.tsx';

export const Markdown = observer(
  ({
    unstyledCodeBlocks,
    content,
    className,
  }: {
    content: string;
    className?: string;
    unstyledCodeBlocks?: boolean;
  }) => {
    const { app } = useRootStore();

    return (
      <div className={twMerge('dn-prose', className)}>
        <MarkdownPrimitive
          unstyledCodeBlocks={unstyledCodeBlocks}
          codeTheme={app.theme?.codeTheme ?? 'github-dark'}
          content={content}
        />
      </div>
    );
  },
);
