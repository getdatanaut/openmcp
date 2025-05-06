import type { ToolName } from '@openmcp/server';

const DELIMITER = '_';

export function parseToolName(name: ToolName): [serverId: string, toolName: ToolName] {
  const delimIndex = name.indexOf(DELIMITER);
  if (delimIndex === -1) {
    throw new Error(`Invalid tool name: ${name}`);
  }

  return [name.slice(0, delimIndex), name.slice(delimIndex + 2)];
}

export function resolveToolName(serverId: string, name: ToolName): ToolName {
  const toolName = [serverId, name].join(DELIMITER);
  return toolName.length > 64 ? toolName.slice(0, 64) : toolName;
}
