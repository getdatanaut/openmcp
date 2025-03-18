import { Markdown as MarkdownPrimitive } from '@libs/ui-primitives/markdown';
import { observer } from 'mobx-react-lite';

import { useRootStore } from '~/hooks/use-root-store.tsx';

export const Markdown = observer(({ content }: { content: string }) => {
  const { app } = useRootStore();

  return <MarkdownPrimitive codeTheme={app.theme?.codeTheme ?? 'github-dark'} content={content} />;
});
