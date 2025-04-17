export function toInterpolable(value: string): string {
  return `{{${value}}}`;
}

export function toScreamCase(value: string): string {
  return value
    .split(' ')
    .map(word => word.toUpperCase())
    .join('_');
}
