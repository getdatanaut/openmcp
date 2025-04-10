const VAR_REGEX = /\{\{([^}]+)}}/g;

export function replaceVariables(input: string, variables: Record<string, unknown>): string {
  return input.replace(VAR_REGEX, (match, name) => String(variables[name] ?? match));
}
