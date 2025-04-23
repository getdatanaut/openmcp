import { useAtomInstance, useAtomValue } from '@zedux/react';

import { authAtom } from '~/atoms/auth.ts';

export function useCurrentUser() {
  const auth = useAtomInstance(authAtom);
  const user = useAtomValue(auth.exports.user);

  return user;
}
