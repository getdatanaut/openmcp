import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRouter as baseCreateRouter, RouterProvider } from '@tanstack/react-router';
import ReactDOM from 'react-dom/client';

import { routeTree } from './routeTree.gen.ts';

export function createRouter() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnReconnect: true,
        refetchOnWindowFocus: true,
        staleTime: 1000 * 30,
      },
    },
  });

  return {
    queryClient,
    router: baseCreateRouter({
      routeTree,
      defaultPreload: 'intent',
      context: { queryClient },
    }),
  };
}

const { queryClient, router } = createRouter();

// Register things for typesafety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

ReactDOM.createRoot(document.getElementById('app')!).render(
  <QueryClientProvider client={queryClient}>
    <RouterProvider router={router} />
  </QueryClientProvider>,
);
