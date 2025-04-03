import '../assets/app.css';

import { DialogContext, MenuContext, tn } from '@libs/ui-primitives';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRootRoute, HeadContent, Outlet, retainSearchParams, useNavigate } from '@tanstack/react-router';
import { observer } from 'mobx-react-lite';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { z } from 'zod';

import { CurrentManagerProvider } from '~/hooks/use-current-manager.tsx';
import { RootStoreContext, useRootStore } from '~/hooks/use-root-store.tsx';
import { createRootStore } from '~/stores/root.ts';
import { ClientServerId, McpServerId } from '~/utils/ids.ts';
import { localDb } from '~/utils/local-db.ts';
import { fallback } from '~/utils/routing.ts';

import { AddClientServerDialog } from './-components/AddClientServerDialog.tsx';
import { MainSidebar } from './-components/MainSidebar.tsx';

const rootSearchSchema = z.object({
  sidebar: fallback(z.enum(['history', 'servers', 'dev', 'settings']).optional(), 'history'),
  server: McpServerId.validator.optional(),
  client: ClientServerId.validator.optional(),
});

export const Route = createRootRoute({
  component: RootComponent,
  validateSearch: rootSearchSchema,
  search: {
    middlewares: [retainSearchParams(['sidebar'])],
  },
});

function RootComponent() {
  useReactScan();

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnReconnect: true,
        refetchOnWindowFocus: true,
      },
    },
  });

  const rootStore = useMemo(() => createRootStore({ localDb, queryClient }), []);

  if (isFirefox()) {
    return <BrowserNotSupported />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <RootStoreContext.Provider value={rootStore}>
        <SidebarLayout>
          <HeadContent />
          <Outlet />
        </SidebarLayout>
      </RootStoreContext.Provider>
    </QueryClientProvider>
  );
}

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

const SidebarLayout = observer(({ children }: { children: ReactNode }) => {
  const { app } = useRootStore();
  const themeClass = app.theme?.themeClass;

  const [rootRef, setRootRef] = useState<HTMLDivElement | null>(null);

  return (
    <CurrentManagerProvider>
      <DialogContext value={{ portalElement: rootRef, backdrop: 'blur' }}>
        <MenuContext value={{ portalElement: rootRef }}>
          <div className={tn('ak-layer-canvas-down min-h-screen', themeClass, `font-${app.fontId}`)} ref={setRootRef}>
            <div className="isolate flex h-screen">
              <div className="h-screen">
                <MainSidebar className={tn('py-2', app.sidebarCollapsed ? 'w-2' : 'w-80')} />
              </div>

              {children}
            </div>

            <GlobalModals />
          </div>
        </MenuContext>
      </DialogContext>
    </CurrentManagerProvider>
  );
});

const GlobalModals = () => {
  const { server, client } = Route.useSearch();
  const navigate = useNavigate();

  return (
    <>
      <AddClientServerDialog
        serverId={server}
        clientServerId={client}
        isOpen={!!server}
        onClose={() => {
          void navigate({ to: '.', search: prev => ({ ...prev, server: undefined, client: undefined }) });
        }}
      />
    </>
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
