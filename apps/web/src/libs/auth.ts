import { createAuthClient } from '@libs/auth/react';

export const { useSession, signIn, signOut, signUp } = createAuthClient();
