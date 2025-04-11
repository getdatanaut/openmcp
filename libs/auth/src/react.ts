import { createAuthClient as baseCreateAuthClient } from 'better-auth/react';

export const createAuthClient = ({ baseURL }: { baseURL?: string } = {}) => {
  return baseCreateAuthClient({
    baseURL,
    plugins: [],
  });
};
