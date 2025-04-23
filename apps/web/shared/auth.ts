import type { JwtPayload } from '@libs/auth/types';
import type { TOrganizationId, TUserId } from '@libs/db-ids';

export interface AuthData extends JwtPayload {
  sub: TUserId;
}

export interface AuthDataWithOrg extends AuthData {
  orgId: TOrganizationId;
}

export function assert(b: unknown, msg: string | (() => string) = 'Assertion failed'): asserts b {
  if (!b) {
    throw new Error(typeof msg === 'string' ? msg : msg());
  }
}

export function assertIsLoggedIn(authData: AuthData | undefined): asserts authData {
  assert(authData, 'you must logged in for this operation');
}

export function assertIsLoggedInWithOrg(authData: AuthData | undefined): asserts authData is AuthDataWithOrg {
  assert(authData?.orgId, 'you must be logged in with an active organization for this operation');
}

export function assertIsRecordOwner(
  authData: AuthData | undefined,
  { createdBy, organizationId }: { createdBy: TUserId; organizationId: TOrganizationId },
): asserts authData {
  assertIsLoggedInWithOrg(authData);
  assert(authData.sub === createdBy, 'user must be the creator of the record');
  assert(authData.orgId === organizationId, 'users active organization must match the record organization');
}

export function assertFound(value: unknown, msg: string | (() => string) = 'Not found'): asserts value {
  if (!value) {
    throw new Error(typeof msg === 'string' ? msg : msg());
  }
}
