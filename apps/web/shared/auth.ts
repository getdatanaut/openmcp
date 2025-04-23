import type { JwtPayload } from '@libs/auth/types';
import type { TUserId } from '@libs/db-ids';

export interface AuthData extends JwtPayload {
  sub: TUserId;
}

export function assert(b: unknown, msg: string | (() => string) = 'Assertion failed'): asserts b {
  if (!b) {
    throw new Error(typeof msg === 'string' ? msg : msg());
  }
}

export function assertIsLoggedIn(authData: AuthData | undefined): asserts authData {
  assert(authData, 'user must be logged in for this operation');
}
