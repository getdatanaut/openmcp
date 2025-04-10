export type McpServerType = string;
export type EncodedSessionId = string;
export type SessionId = `${string}_${EncodedSessionId}`;

export type SessionIdOptions = {
  prefix?: string;
  delimiter?: string;
};

export const SESSION_ID_PREFIX = 'openmcp' as const;
export const SESSION_ID_DELIMITER = '::' as const;

const defaultSessionIdOptions = {
  prefix: SESSION_ID_PREFIX,
  delimiter: SESSION_ID_DELIMITER,
} as const;

/**
 * Session ID is encoded as a base64 string of the form:
 *
 * `{serverType}::{uid}::{doId}`
 *
 * - `serverType` is the unique identifier for the MCP Server (`eg. openapi`).
 * - `uid` is a random UUID, used to ensure the session is unique.
 * - `doId` is the DurableObjectId for the MCP Server.
 *
 * Additionally, Session IDs are prefixed with a namespace (`openmcp`):
 *
 * `openmcp_{sessionId}`
 *
 * This allows us to easily identify the MCP Server, unique session, and durable object instance.
 */
export const SessionId = {
  encode: (
    {
      doId,
      serverType,
    }: {
      doId: DurableObjectId;
      serverType: McpServerType;
    },
    options: SessionIdOptions = defaultSessionIdOptions,
  ): SessionId => {
    const prefix = options.prefix ?? SESSION_ID_PREFIX;
    const delimiter = options.delimiter ?? SESSION_ID_DELIMITER;

    const uid = crypto.randomUUID();
    const unencodedSessionId = [serverType, uid, doId].join(delimiter);
    const encodedSessionId = btoa(unencodedSessionId);
    return `${prefix}_${encodedSessionId}`;
  },

  decode: (sessionId: SessionId | string, options: SessionIdOptions = defaultSessionIdOptions) => {
    const prefix = options.prefix ?? SESSION_ID_PREFIX;
    const delimiter = options.delimiter ?? SESSION_ID_DELIMITER;

    const [openmcp, encodedSessionId] = sessionId.split('_');

    if (!encodedSessionId || openmcp !== prefix) {
      throw new Error('Invalid session ID');
    }

    const [serverType, uid, doId] = atob(encodedSessionId).split(delimiter);

    if (!serverType || !uid || !doId) {
      throw new Error('MCP Server not found');
    }

    return { openmcp, serverType, uid, doId } as const;
  },

  isValid: (
    sessionId: SessionId | string,
    { doId, serverType }: { doId: string; serverType: McpServerType },
    options: SessionIdOptions = defaultSessionIdOptions,
  ): sessionId is SessionId => {
    try {
      const decodedSessionId = SessionId.decode(sessionId, options);
      return decodedSessionId.serverType === serverType && decodedSessionId.doId === doId;
    } catch {
      return false;
    }
  },
};
