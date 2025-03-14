import type { Element as HastElement } from 'hast';
import type { ReactElement, ReactNode } from 'react';
import React from 'react';
import { type Components, MarkdownHooks } from 'react-markdown';
import reactToText from 'react-to-text';
import rehypePrettyCode from 'rehype-pretty-code';
import remarkGfm from 'remark-gfm';

import { tn } from '../../utils/tw.ts';
import { CopyButton } from '../Button/copy-button.tsx';

export const Markdown = ({
  content,
  fallback,
  codeTheme,
}: {
  content?: string;
  fallback?: ReactNode;
  codeTheme: string;
}) => {
  return (
    <MarkdownHooks
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[
        [
          rehypePrettyCode,
          {
            theme: codeTheme,
            keepBackground: false,
            defaultLang: {
              block: 'plaintext',
              inline: 'plaintext',
            },
          },
        ],
      ]}
      fallback={fallback}
      components={MarkdownComponents}
    >
      {content}
    </MarkdownHooks>
  );
};

const MarkdownBlockquote: Components['blockquote'] = props => {
  return <blockquote>{props.children}</blockquote>;
};

const MarkdownCode: Components['code'] = props => {
  // If style is set to grid, this is being rendered by the pre / larger code fence block
  const isInCodeFence = props.style?.display === 'grid';
  if (isInCodeFence) return <code {...props} />;

  return <code className="ak-layer-down ak-frame-xs px-1 py-px" {...props} />;
};

const MarkdownFigure: Components['figure'] = ({ className, node, children, ...props }) => {
  const isCodeFigure = props['data-rehype-pretty-code-figure'] !== undefined;

  const classes = tn(isCodeFigure && 'ak-frame ak-layer-[down-0.5] -mx-1.5 text-sm leading-relaxed', className);

  let figureChildren: ReactNode[] = [];

  if (isCodeFigure) {
    const firstChild = node?.children[0];
    let codeTitle: string | null = null;
    let firstChildIsTitle = false;
    if (firstChild?.type === 'element') {
      firstChildIsTitle = firstChild.properties?.['data-rehype-pretty-code-title'] !== undefined;
      if (firstChildIsTitle) {
        codeTitle =
          firstChild.children[0]?.type === 'text'
            ? firstChild.children[0].value || (firstChild.properties['data-language'] as string)
            : null;
      } else {
        codeTitle = (firstChild.children[0] as any).properties?.['data-language'] || null;
      }
    }

    figureChildren.push(
      <figcaption key="figcap" className="flex items-center border-b-[0.5px] py-2 pr-3 pl-4">
        {codeTitle ? <div>{codeTitle}</div> : null}

        <CopyButton
          className="ml-auto"
          variant="ghost"
          size="xs"
          onClick={(_, { copy }) => {
            const elems = React.Children.toArray(children);
            const codeElem = elems.find(
              elem => (elem as ReactElement<{ node?: HastElement }>).props?.node?.tagName === 'pre',
            );

            if (!codeElem) {
              alert('Error copying code: no code block found');
              return;
            }

            const code = reactToText(codeElem);
            copy(code);
          }}
        />
      </figcaption>,
    );

    figureChildren.push(...React.Children.toArray(children).slice(firstChildIsTitle ? 1 : 0));
  }

  if (figureChildren.length === 0) {
    figureChildren = React.Children.toArray(children);
  }

  return <figure className={classes} {...props} children={figureChildren} />;
};

const MarkdownPre: Components['pre'] = props => {
  return <pre className="px-0 py-4" {...props} />;
};

const MarkdownComponents: Components = {
  blockquote: MarkdownBlockquote,
  code: MarkdownCode,
  figure: MarkdownFigure,
  pre: MarkdownPre,
};
