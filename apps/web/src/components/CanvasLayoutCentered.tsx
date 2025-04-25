import { Heading, tn } from '@libs/ui-primitives';

export function CanvasLayoutCentered({
  title,
  children,
  footer,
}: {
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4">
      {title && <Heading size={6}>{title}</Heading>}
      <div className={tn('ak-light:ak-layer ak-layer-0.5 m-[var(--canvas-m)] rounded-sm border shadow-xs')}>
        {children}
      </div>
      {footer}
    </div>
  );
}
