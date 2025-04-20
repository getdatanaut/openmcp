import { createAuthClient } from '@libs/auth/react';

import { AUTH_BASE_PATH } from '../../worker/consts.ts';

export const { useSession, signIn, signOut, signUp, oauth2 } = createAuthClient({
  basePath: AUTH_BASE_PATH,
});
