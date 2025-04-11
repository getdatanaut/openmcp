const DELIMITER = '-';

export function parseToolName(name: string): [serverId: string, toolName: string] {
  const delimIndex = name.indexOf(DELIMITER);
  if (delimIndex === -1) {
    throw new Error(`Invalid tool name: ${name}`);
  }

  return [name.slice(0, delimIndex), name.slice(delimIndex + 2)];
}

export function resolveToolName(serverId: string, name: string) {
  const toolName = [serverId, name].join(DELIMITER);
  return toolName.length > 64 ? toolName.slice(0, 64) : toolName;
}
