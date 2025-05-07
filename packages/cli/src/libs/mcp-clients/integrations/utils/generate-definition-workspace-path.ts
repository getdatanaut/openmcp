import path from 'node:path';

export default function generateDefinitionWorkspacePath(variable: string, configFilepath: string, target: string) {
  if (URL.canParse(target)) {
    return target;
  }

  return `${variable}/${path.relative(path.dirname(configFilepath), target)}`;
}
