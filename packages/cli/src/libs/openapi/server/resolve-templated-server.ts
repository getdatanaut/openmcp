import type { INodeVariable, IServer } from '@stoplight/types';

import applyUrlVariables from './apply-url-variables.ts';

export default function resolveTemplatedServer(
  server: IServer & { variables: Record<string, INodeVariable> },
): string[] {
  const variablePairs: [name: string, values: string[]][] = [];

  for (const [name, value] of Object.entries(server.variables)) {
    // technically default is required by spec, but we cannot be sure whether spec is valid or not
    if (value.default !== undefined) {
      variablePairs.push([name, [value.default]]);
    } else if (value.enum !== undefined) {
      variablePairs.push([name, value.enum.map(enumValue => String(enumValue))]);
    } else {
      variablePairs.push([name, []]);
    }
  }

  return applyUrlVariables(server.url, variablePairs);
}

export function isTemplatedServer(server: IServer): server is IServer & { variables: Record<string, INodeVariable> } {
  return Object.hasOwn(server, 'variables');
}
