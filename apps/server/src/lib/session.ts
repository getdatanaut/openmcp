import type { MCPServerIdToDoNamespace } from '../mcp/index.ts';

export const SESSION_PREFIX = 'openmcp';

export type McpServerId = keyof typeof MCPServerIdToDoNamespace;
export type EncodedSessionId = string;
export type SessionId = `${typeof SESSION_PREFIX}_${EncodedSessionId}`;

/**
 * Session ID is encoded as a base64 string of the form:
 *
 * `{mcpServerId}_{uid}_{doId}`
 *
 * - `mcpServerId` is the unique identifier for the MCP Server (`eg. OpenMcpOpenAPI`).
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
  encode: ({ doId, mcpServerId }: { doId: DurableObjectId; mcpServerId: McpServerId }): SessionId => {
    const uid = crypto.randomUUID();
    const encodedSessionId = btoa(`${mcpServerId}_${uid}_${doId}`);
    return `openmcp_${encodedSessionId}`;
  },

  decode: (sessionId: SessionId | string) => {
    const [openmcp, sessionKey] = sessionId.split('_');

    if (!sessionKey || openmcp !== SESSION_PREFIX) {
      throw new Error('Invalid session ID');
    }

    const [mcpServerId, uid, doId] = atob(sessionKey).split('_');

    if (!mcpServerId || !uid || !doId) {
      throw new Error('MCP Server not found');
    }

    return { openmcp, mcpServerId, uid, doId } as const;
  },

  isValid: (
    sessionId: SessionId | string,
    { doId, mcpServerId }: { doId: string; mcpServerId: McpServerId },
  ): sessionId is SessionId => {
    try {
      const decodedSessionId = SessionId.decode(sessionId);
      return decodedSessionId.mcpServerId === mcpServerId && decodedSessionId.doId === doId;
    } catch {
      return false;
    }
  },
};
