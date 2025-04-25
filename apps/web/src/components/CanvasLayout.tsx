import { tn, twMerge } from '@libs/ui-primitives';

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
  return (
    <div className={twMerge('flex h-dvh flex-1 flex-col', className)}>
      {header ? (
        <div className="flex h-[var(--canvas-header-h)] flex-shrink-0 items-center pr-4 pl-2">
          <div className="flex h-full flex-1 items-center gap-4 px-4">{header}</div>
        </div>
      ) : null}

      <div
        className={tn(
          'ak-light:ak-layer ak-layer-0.5 relative mr-[var(--canvas-m)] mb-[var(--canvas-m)] flex flex-1 flex-col overflow-hidden rounded-sm border shadow-xs',
          !header && 'mt-[var(--canvas-m)]',
        )}
      >
        <div className={twMerge('overflow-scroll', contentClassName)}>{children}</div>
      </div>
    </div>
  );
}
