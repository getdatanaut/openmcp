import '../assets/app.css';

import { DialogContext, tn } from '@libs/ui-primitives';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRootRoute, HeadContent, Outlet, retainSearchParams, useNavigate } from '@tanstack/react-router';
import { observer } from 'mobx-react-lite';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { z } from 'zod';

import { CurrentManagerProvider } from '~/hooks/use-current-manager.tsx';
import { RootStoreContext, useRootStore } from '~/hooks/use-root-store.tsx';
import { createRootStore } from '~/stores/root.ts';
import { McpServerId } from '~/utils/ids.ts';
import { localDb } from '~/utils/local-db.ts';
import { fallback } from '~/utils/routing.ts';

import { AddClientServerDialog } from './-components/AddClientServerDialog.tsx';
import { MainSidebar } from './-components/MainSidebar.tsx';

const rootSearchSchema = z.object({
  sidebar: fallback(z.enum(['history', 'servers', 'dev', 'settings']).optional(), 'history'),
  server: McpServerId.validator.optional(),
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

const SidebarLayout = observer(({ children }: { children: ReactNode }) => {
  const { app } = useRootStore();
  const themeClass = app.theme?.themeClass;

  const [rootRef, setRootRef] = useState<HTMLDivElement | null>(null);

  return (
    <CurrentManagerProvider>
      <DialogContext value={{ portalElement: rootRef, backdrop: 'blur' }}>
        <div className={tn('min-h-screen', themeClass && `${themeClass} ak-layer-canvas`)} ref={setRootRef}>
          <div className="isolate flex min-h-screen">
            {children}

            <div className="ml-auto h-screen border-l-[0.5px]">
              <MainSidebar className="w-72 lg:w-96" />
            </div>
          </div>

          <GlobalModals />
        </div>
      </DialogContext>
    </CurrentManagerProvider>
  );
});

const GlobalModals = () => {
  const { server } = Route.useSearch();
  const navigate = useNavigate();

  return (
    <>
      <AddClientServerDialog
        serverId={server}
        isOpen={!!server}
        onClose={() => {
          void navigate({ to: '.', search: prev => ({ ...prev, server: undefined }) });
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
