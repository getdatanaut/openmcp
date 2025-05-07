import { getToolName } from '@openmcp/openapi';

import { transformOasOperations } from './http-spec.ts';

type ListedTool = {
  readonly name: string;
  readonly route: string;
};

export default function listTools(document: Record<string, unknown>): ListedTool[] {
  const list: ListedTool[] = [];

  for (const operation of transformOasOperations(document)) {
    const value = getToolName(operation);
    list.push({
      name: value,
      route: `${operation.method.toUpperCase()} ${operation.path}`,
    });
  }

  return list;
}
