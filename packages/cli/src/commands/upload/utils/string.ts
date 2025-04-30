const SENTENCE_REGEX = /[A-Za-z][^.!?]+[.!?]/;

export function getSummary(value: string): string | undefined {
  return SENTENCE_REGEX.exec(value)?.[0];
}
