import '../assets/app.css';

import { DialogContext, MenuContext, tn } from '@libs/ui-primitives';
import { type QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import { useAtomInstance, useAtomValue } from '@zedux/react';
import { useEffect, useState } from 'react';

import { layoutAtom } from '~/atoms/layout.ts';
import { themeAtom } from '~/atoms/theme.ts';

import { MainSidebar } from './-components/MainSidebar.tsx';
import { Providers } from './-components/Providers.tsx';

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  component: RootComponent,
});

function RootComponent() {
  useReactScan();

  if (isFirefox()) {
    return <BrowserNotSupported />;
  }

  return (
    <Providers>
      <SidebarLayout>
        <Outlet />
      </SidebarLayout>
    </Providers>
  );
}

function SidebarLayout({ children }: { children: React.ReactNode }) {
  const theme = useAtomInstance(themeAtom);
  const themeClass = useAtomValue(theme.exports.themeClass);
  const fontClass = useAtomValue(theme.exports.fontClass);
  const { sidebarCollapsed } = useAtomValue(layoutAtom);

  const [rootRef, setRootRef] = useState<HTMLDivElement | null>(null);

  return (
    <DialogContext value={{ portalElement: rootRef, backdrop: 'blur' }}>
      <MenuContext value={{ portalElement: rootRef }}>
        <div className={tn('ak-layer-canvas-down-0.5 min-h-dvh', themeClass, fontClass)} ref={setRootRef}>
          <div className="isolate flex h-dvh">
            <MainSidebar className={tn('h-full', sidebarCollapsed ? 'w-2' : 'w-80')} />
            {children}
          </div>

          {/* <GlobalModals /> */}
        </div>
      </MenuContext>
    </DialogContext>
  );
}

const isFirefox = () => {
  return typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
};

function BrowserNotSupported() {
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
}

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
