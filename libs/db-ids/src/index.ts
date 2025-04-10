import { Id } from '@libs/utils-ids';

export const UserId = Id.dbIdFactory('u');
export type UserNamespace = (typeof UserId)['namespace'];
export type TUserId = ReturnType<(typeof UserId)['generate']>;

export const UserSessionId = Id.dbIdFactory('sess');
export type UserSessionNamespace = (typeof UserSessionId)['namespace'];
export type TUserSessionId = ReturnType<(typeof UserSessionId)['generate']>;

export const UserAccountId = Id.dbIdFactory('acc');
export type UserAccountNamespace = (typeof UserAccountId)['namespace'];
export type TUserAccountId = ReturnType<(typeof UserAccountId)['generate']>;

export const AuthVerificationId = Id.dbIdFactory('ver');
export type AuthVerificationNamespace = (typeof AuthVerificationId)['namespace'];
export type TAuthVerificationId = ReturnType<(typeof AuthVerificationId)['generate']>;
