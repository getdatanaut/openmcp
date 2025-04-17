export function toInterpolable(value: string): string {
  return `{{${value}}}`;
}

export function toScreamCase(value: string): string {
  return value
    .split(' ')
    .map(word => word.toUpperCase())
    .join('_');
}

const SENTENCE_REGEX = /[A-Za-z][^.!?]+[.!?]/;

export function getSummary(value: string): string | undefined {
  return SENTENCE_REGEX.exec(value)?.[0];
}
