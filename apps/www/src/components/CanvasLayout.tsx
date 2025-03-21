import { observer } from 'mobx-react-lite';
import { type ReactNode, useEffect } from 'react';

import { useRootStore } from '~/hooks/use-root-store.tsx';

export const CanvasLayout = observer(({ header, children }: { header?: ReactNode; children: ReactNode }) => {
  const { app } = useRootStore();

  useEffect(() => {
    app.setCanvasHasHeader(!!header);
  }, [header, app]);

  return (
    <div className="flex h-screen flex-1 flex-col">
      {header ? (
        <div className="px-2 pt-2">
          <div className="flex h-10 flex-shrink-0 items-center">
            <div className="flex h-full flex-1 items-center gap-4 px-4">{header}</div>
          </div>
        </div>
      ) : null}

      <div className="ak-layer-[0.7] relative my-2 mr-2 flex flex-1 flex-col overflow-hidden rounded-sm border-[0.5px] shadow-xs">
        {children}
      </div>
    </div>
  );
});
