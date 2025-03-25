import type { UseQueryOptions } from '@tanstack/react-query';

export const queryOptions = {
  servers: () =>
    ({
      queryKey: ['servers'],
      staleTime: 1000 * 60 * 60 * 24,
    }) satisfies UseQueryOptions,

  clientServers: () =>
    ({
      queryKey: ['clientServers'],
    }) satisfies UseQueryOptions,

  threads: () =>
    ({
      queryKey: ['threads'],
    }) satisfies UseQueryOptions,

  thread: ({ threadId }: { threadId: string }) =>
    ({
      queryKey: ['threads', threadId],
    }) satisfies UseQueryOptions,

  threadMessages: ({ threadId }: { threadId: string }) =>
    ({
      queryKey: ['threads', threadId, 'messages'],
    }) satisfies UseQueryOptions,

  directory: () =>
    ({
      queryKey: ['directory'],
      staleTime: 1000 * 60 * 60 * 24,
    }) satisfies UseQueryOptions,

  directoryServer: ({ serverId }: { serverId: string }) =>
    ({
      queryKey: ['directory', serverId],
      staleTime: 1000 * 60 * 60 * 24,
    }) satisfies UseQueryOptions,
};
