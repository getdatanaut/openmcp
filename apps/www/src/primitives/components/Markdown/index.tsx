import type { Element as HastElement } from 'hast';
import type { ReactElement, ReactNode } from 'react';
import React from 'react';
import { type Components, MarkdownHooks } from 'react-markdown';
import reactToText from 'react-to-text';
import rehypePrettyCode from 'rehype-pretty-code';
import remarkGfm from 'remark-gfm';

import { twJoin } from '../../tw.ts';

export const Markdown = ({ content, fallback, theme }: { content?: string; fallback?: ReactNode; theme: string }) => {
  return (
    <MarkdownHooks
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[
        [
          rehypePrettyCode,
          {
            theme,
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

  const classes = twJoin(isCodeFigure && 'ak-frame ak-layer-down -mx-2 text-sm leading-relaxed', className);

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
      <figcaption key="figcap" className="flex items-center border-b-[0.5px] px-4 py-2">
        {codeTitle ? <div>{codeTitle}</div> : null}
        <div
          className="ml-auto"
          onClick={() => {
            const elems = React.Children.toArray(children);
            const codeElem = elems.find(
              elem => (elem as ReactElement<{ node?: HastElement }>).props?.node?.tagName === 'pre',
            );

            if (!codeElem) {
              alert('Error copying code: no code block found');
              return;
            }

            const code = reactToText(codeElem);
            console.log(code);
            alert('todo copy button');
          }}
        >
          ...Copy...
        </div>
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
