import { Markdown as MarkdownPrimitive } from '@libs/ui-primitives/markdown';
import { observer } from 'mobx-react-lite';
import { twMerge } from 'tailwind-merge';

import { useRootStore } from '~/hooks/use-root-store.tsx';

export const Markdown = observer(({ content, className }: { content: string; className?: string }) => {
  const { app } = useRootStore();

  return (
    <div className={twMerge('dn-prose', className)}>
      <MarkdownPrimitive codeTheme={app.theme?.codeTheme ?? 'github-dark'} content={content} />
    </div>
  );
});
