import { QueryClient } from '@tanstack/react-query';

export const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnReconnect: true,
        refetchOnWindowFocus: true,
      },
    },
  });
};
