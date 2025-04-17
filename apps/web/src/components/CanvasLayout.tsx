import { twMerge } from '@libs/ui-primitives';

export function CanvasLayout({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={twMerge('flex h-full flex-1 flex-col', className)}>
      <div className="ak-light:ak-layer ak-layer-[0.5] relative flex flex-1 flex-col rounded-sm border-[0.5px] shadow-xs">
        {children}
      </div>
    </div>
  );
}
