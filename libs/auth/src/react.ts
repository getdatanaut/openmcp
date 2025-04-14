import { createAuthClient as baseCreateAuthClient } from 'better-auth/react';

export const createAuthClient = ({ baseURL, basePath }: { baseURL?: string; basePath: string }) => {
  return baseCreateAuthClient({
    baseURL,
    basePath,
    plugins: [],
  });
};
