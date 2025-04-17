import { twMerge } from '@libs/ui-primitives';

export function CanvasLayout({
  children,
  className,
  contentClassName,
}: {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <div className={twMerge('flex h-full flex-1 flex-col', className)}>
      <div className="ak-light:ak-layer ak-layer-0.5 relative my-2 mr-2 flex flex-1 flex-col overflow-hidden rounded-sm border shadow-xs">
        <div className={twMerge('flex flex-1 flex-col overflow-scroll', contentClassName)}>{children}</div>
      </div>
    </div>
  );
}
