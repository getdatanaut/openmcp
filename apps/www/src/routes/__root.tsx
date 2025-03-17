import '../assets/app.css';

import { tn } from '@libs/ui-primitives';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRootRoute, HeadContent, Outlet, retainSearchParams } from '@tanstack/react-router';
import { observer } from 'mobx-react-lite';
import { type ReactNode, useEffect, useMemo } from 'react';
import { z } from 'zod';

import { CurrentManagerProvider } from '~/hooks/use-current-manager.tsx';
import { RootStoreContext, useRootStore } from '~/hooks/use-root-store.tsx';
import { createRootStore } from '~/stores/root.ts';
import { localDb } from '~/utils/local-db.ts';
import { fallback } from '~/utils/routing.ts';

import { MainSidebar } from './-components/MainSidebar.tsx';
// import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';

const rootSearchSchema = z.object({
  sidebar: fallback(z.enum(['history', 'servers', 'dev', 'settings']).default('history'), 'history'),
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

  const rootStore = useMemo(() => createRootStore({ localDb }), []);

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

  return (
    <CurrentManagerProvider>
      <div className={tn('flex min-h-screen', themeClass && `${themeClass} ak-layer-canvas`)}>
        {children}

        <div className="ml-auto h-screen border-l-[0.5px]">
          <MainSidebar />
        </div>
      </div>
    </CurrentManagerProvider>
  );
});

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
