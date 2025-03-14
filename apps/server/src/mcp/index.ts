import { getOpenMcpOpenAPIConfigFromRequest, OpenMcpOpenAPI } from './openapi.ts';

/**
 * Map of MCP Server ID to the Durable Object namespace.
 */
export const MCPServerIdToDoNamespace = {
  [OpenMcpOpenAPI.mcpServerId]: 'OpenMcpOpenAPI',
} as const;

/**
 * Map of MCP Server ID to function for extracting the MCP config from the request
 */
export const MCPServerConfigs = {
  [OpenMcpOpenAPI.mcpServerId]: getOpenMcpOpenAPIConfigFromRequest,
} as const;

/**
 * Check if the MCP Server ID is valid.
 */
export function isMcpServerId(mcpServerId: string): mcpServerId is keyof typeof MCPServerIdToDoNamespace {
  return mcpServerId in MCPServerIdToDoNamespace;
}
