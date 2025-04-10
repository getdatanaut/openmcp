import { createContext } from '../../utils/context.ts';

export const [MarkdownInternalContext, useMarkdownInternalContext] = createContext<{
  unstyledCodeBlocks?: boolean;
}>({
  name: 'MarkdownInternalContext',
  strict: true,
});
