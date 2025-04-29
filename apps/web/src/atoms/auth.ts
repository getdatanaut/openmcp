import { type AuthSession, type AuthUser, createAuthClient } from '@libs/auth/react';
import { api, atom, injectCallback, injectMemo, injectPromise } from '@zedux/react';

import { AUTH_BASE_PATH } from '~shared/consts.ts';

import { injectLocalStorage } from './local-storage.ts';

export const authAtom = atom('auth', () => {
  const signal = injectLocalStorage({
    key: 'auth',
    persistKeys: ['jwt', 'session.activeOrganizationId', 'user'],
    defaultVal: {
      session: null as AuthSession | null,
      user: null as AuthUser | null,
      jwt: null as string | null,
    },
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
          const { session = null, user = null } = (context.data || {}) as {
            session?: AuthSession | null;
            user?: AuthUser | null;
          };
          signal.mutate({ session, user, jwt });
        },
        onError(err) {
          // @TODO handle errors
          console.warn('AUTH ERROR', err);
        },
      },
    });
  }, []);

  const onLoadSessionCheck = injectPromise(() => getSession(), []);

  const refreshToken = injectCallback(async () => {
    if (!signal.get().jwt) return;

    const { data, error } = await client.token();

    // @TODO handle errors
    if (error) {
      console.warn('auth: refresh token error', error);
      return;
    }

    signal.mutate({ jwt: data.token });

    return data.token;
  }, []);

  const signOut = injectCallback(async () => {
    await client.signOut();
    signal.mutate({ jwt: null, user: null, session: null });
  }, []);

  return api(signal).setExports(
    {
      signIn: client.signIn,
      signUp: client.signUp,
      oauth2: client.oauth2,
      refreshToken,
      signOut,
      getSession,

      onLoadSessionCheck,
      // will be true when the initial get session promise has resolved
      hasBootstrapped: () => onLoadSessionCheck.signal.get().status !== 'loading',
      // quick hint to see if the user is *likely* logged in. jwt still has to be valid to use of course
      isLoggedIn: () => !!signal.get().jwt,
      user: () => signal.get().user,

      // Note: these derived values should be pulled from the props that are stored in local storage
      // e.g. user.id rather than session.userId since session.userId isn't currently persisted
      jwt: () => signal.get().jwt,
      userId: () => signal.get().user?.id,
      orgId: () => signal.get().session?.activeOrganizationId,
    },
    { wrap: false },
  );
});
