import { ZeroProvider as BaseZeroProvider } from '@rocicorp/zero/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type RegisteredRouter, RouterProvider } from '@tanstack/react-router';
import { createEcosystem, EcosystemProvider, useAtomValue } from '@zedux/react';
import { useMemo } from 'react';

import { zeroAtom } from '~/atoms/zero.ts';

export function Providers({ router }: { router: RegisteredRouter }) {
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            refetchOnReconnect: true,
            refetchOnWindowFocus: true,
            staleTime: 1000 * 30,
          },
        },
      }),
    [],
  );

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
  }, [queryClient, router]);

  return (
    <QueryClientProvider client={queryClient}>
      <EcosystemProvider ecosystem={ecosystem}>
        <RouterProvider
          router={router}
          context={{ queryClient, ecosystem }}
          Wrap={({ children }) => <ZeroProvider>{children}</ZeroProvider>}
        />
      </EcosystemProvider>
    </QueryClientProvider>
  );
}

function ZeroProvider({ children }: { children: React.ReactNode }) {
  const zero = useAtomValue(zeroAtom);

  return <BaseZeroProvider zero={zero}>{children}</BaseZeroProvider>;
}
