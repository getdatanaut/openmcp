import { tn, twMerge } from '@libs/ui-primitives';
import { useMemo } from 'react';

export function CanvasLayout({
  children,
  className,
  contentClassName,
  header,
}: {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  header?: React.ReactNode;
}) {
  // calculating the height of the canvas without JS
  const canvasHeight = useMemo(() => {
    const calc = [
      '100dvh',
      // if we have a header, only the margin below the canvas is relevant, otherwise top and bottom are
      header ? 'var(--canvas-m)' : 'var(--canvas-m)*2',
      // if we have a header, account for it's height
      header ? 'var(--canvas-header-h)' : null,
      // border width of canvas is 0.5px, so 1px for top and bottom border
      '1px',
    ]
      .filter(Boolean)
      .join(' - ');

    return `calc(${calc})`;
  }, [header]);

  return (
    <div
      className={twMerge(`flex h-dvh flex-1 flex-col`, className)}
      style={{
        // @ts-expect-error react typing doesn't support css vars
        '--canvas-h': canvasHeight,
      }}
    >
      {header ? (
        <div className="flex h-[var(--canvas-header-h)] flex-shrink-0 items-center pr-4 pl-2">
          <div className="flex h-full flex-1 items-center gap-4 px-4">{header}</div>
        </div>
      ) : null}

      <div
        className={tn(
          'ak-light:ak-layer ak-layer-0.5 relative mr-[var(--canvas-m)] flex flex-1 flex-col overflow-hidden rounded-sm border shadow-xs',
          header && 'mb-[var(--canvas-m)]',
          !header && 'my-[var(--canvas-m)]',
        )}
      >
        <div className={twMerge('overflow-scroll', contentClassName)}>{children}</div>
      </div>
    </div>
  );
}
