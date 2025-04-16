import '../assets/app.css';

import { DialogContext, MenuContext, tn } from '@libs/ui-primitives';
import { QueryClientProvider } from '@tanstack/react-query';
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';

import { createQueryClient } from '~/libs/query.ts';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  useReactScan();

  const queryClient = useMemo(() => createQueryClient(), []);

  if (isFirefox()) {
    return <BrowserNotSupported />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SidebarLayout>
        <Outlet />
      </SidebarLayout>
    </QueryClientProvider>
  );
}

const SidebarLayout = ({ children }: { children: React.ReactNode }) => {
  const themeClass = 'theme-dracula';
  const font = 'font-mono';

  const [rootRef, setRootRef] = useState<HTMLDivElement | null>(null);

  return (
    <DialogContext value={{ portalElement: rootRef, backdrop: 'blur' }}>
      <MenuContext value={{ portalElement: rootRef }}>
        <div className={tn('ak-layer-canvas-down min-h-dvh', themeClass, font)} ref={setRootRef}>
          <div className="isolate flex h-dvh">{children}</div>

          {/* <GlobalModals /> */}
        </div>
      </MenuContext>
    </DialogContext>
  );
};

const isFirefox = () => {
  return typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
};

const BrowserNotSupported = () => {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-4">
      <div>
        Firefox is currently not supported. Please use Safari, Edge, or a Chromium based browser (Chrome, Arc, etc).
      </div>

      <div>
        For the technically curious among you, Firefox should work once{' '}
        <a className="text-[blue]" href="https://bugzilla.mozilla.org/show_bug.cgi?id=1951206" target="_blank">
          this bug
        </a>{' '}
        is resolved.
      </div>
    </div>
  );
};

let reactScanAdded = false;
const useReactScan = () => {
  useEffect(() => {
    if (!import.meta.env.DEV || reactScanAdded) return;

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/react-scan/dist/auto.global.js';
    script.async = true;
    document.body.appendChild(script);

    reactScanAdded = true;
  }, []);
};
