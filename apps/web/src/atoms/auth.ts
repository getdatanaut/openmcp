import { type AuthSession, type AuthUser, createAuthClient } from '@libs/auth/react';
import { api, atom, injectCallback, injectMemo, injectSignal } from '@zedux/react';

import { AUTH_BASE_PATH } from '~shared/consts.ts';

export const authAtom = atom('auth', () => {
  const signal = injectSignal({
    hasBootstrapped: false,
    session: null as AuthSession | null,
    user: null as AuthUser | null,
    jwt: null as string | null,
  });

  const client = injectMemo(
    () =>
      createAuthClient({
        basePath: AUTH_BASE_PATH,
      }),
    [],
  );

  const getSession = injectCallback(async () => {
    return client.getSession({
      fetchOptions: {
        async onSuccess(context) {
          const jwt = context.response.headers.get('set-auth-jwt');
          const { session = null, user = null } = context.data || {};
          signal.mutate({ session, user, jwt, hasBootstrapped: true });
        },
        onError(err) {
          // @TODO handle errors
          console.warn('AUTH ERROR', err);
          signal.mutate({ hasBootstrapped: true });
        },
      },
    });
  }, []);

  const onLoadSessionCheck = injectMemo(() => getSession(), []);

  const refreshToken = injectCallback(async () => {
    if (!signal.get().jwt) return;

    const { data, error } = await client.token();

    // @TODO handle errors
    if (error) {
      console.warn('REFRESH TOKEN ERROR', error);
      return;
    }

    signal.mutate({ jwt: data.token });

    return data.token;
  }, []);

  const signOut = injectCallback(async () => {
    await client.signOut();
    signal.mutate({ jwt: null, user: null, session: null });
  }, []);

  return api(signal)
    .setPromise(onLoadSessionCheck)
    .setExports(
      {
        signIn: client.signIn,
        signUp: client.signUp,
        oauth2: client.oauth2,
        refreshToken,
        signOut,
        getSession,

        hasBootstrapped: () => signal.get().hasBootstrapped,
        jwt: () => signal.get().jwt,
        userId: () => signal.get().user?.id,
        orgId: () => signal.get().session?.activeOrganizationId,
        user: () => signal.get().user,
      },
      { wrap: false },
    );
});
