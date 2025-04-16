export function CanvasLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh flex-1 flex-col">
      <div className="ak-layer-[0.5] relative m-2 flex flex-1 flex-col overflow-hidden rounded-sm border-[0.5px] shadow-xs">
        {children}
      </div>
    </div>
  );
}
