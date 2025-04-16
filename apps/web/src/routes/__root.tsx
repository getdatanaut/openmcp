import '../assets/app.css';

import { ButtonGroup, DialogContext, MenuContext, tn } from '@libs/ui-primitives';
import { type QueryClient, useQueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, Outlet, useRouter } from '@tanstack/react-router';
import { createEcosystem, EcosystemProvider, useAtomInstance, useAtomValue } from '@zedux/react';
import { useEffect, useMemo, useState } from 'react';

import { themeAtom } from '~/atoms/theme.ts';
import { SettingsMenu } from '~/components/SettingsMenu.tsx';

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

function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const ecosystem = useMemo(() => {
    const ecosystem = // for debugging: make the ecosystem globally accessible
      ((globalThis as any).ecosystem = createEcosystem({
        ssr: typeof window === 'undefined',
        context: {
          router,
          queryClient,
        },
      }));

    return ecosystem;
  }, [router, queryClient]);

  return <EcosystemProvider ecosystem={ecosystem}>{children}</EcosystemProvider>;
}

function SidebarLayout({ children }: { children: React.ReactNode }) {
  const theme = useAtomInstance(themeAtom);
  const themeClass = useAtomValue(theme.exports.themeClass);
  const fontClass = useAtomValue(theme.exports.fontClass);
  // const sidebarCollapsed = true;

  const [rootRef, setRootRef] = useState<HTMLDivElement | null>(null);

  return (
    <DialogContext value={{ portalElement: rootRef, backdrop: 'blur' }}>
      <MenuContext value={{ portalElement: rootRef }}>
        <div className={tn('ak-layer-canvas-down min-h-dvh', themeClass, fontClass)} ref={setRootRef}>
          <div className="isolate flex h-dvh">
            {/* <MainSidebar className={tn('h-dvh py-2', sidebarCollapsed ? 'w-2' : 'w-80')} /> */}
            <div className="absolute top-4 left-4 z-10">
              <ButtonGroup size="sm" variant="outline">
                <SettingsMenu />
              </ButtonGroup>
            </div>
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
