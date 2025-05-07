export default function inferTargetType(target: string) {
  switch (true) {
    case target.startsWith('ag_'):
      return 'agent-id' as const;
    case true:
    default:
      // for now everything else is OpenAPI
      return 'openapi' as const;
  }
}
