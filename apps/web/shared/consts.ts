export const RPC_BASE_PATH = '/__rpc' as const;

export const API_BASE_PATH = '/api' as const;

export const AUTH_BASE_PATH = `${API_BASE_PATH}/auth` as const;

export const ZERO_PUSH_PATH = `${API_BASE_PATH}/push` as const;

export const CACHE_NONE = { ttl: 'none' } as const;
export const CACHE_AWHILE = { ttl: '1d' } as const;
export const CACHE_FOREVER = { ttl: 'forever' } as const;
